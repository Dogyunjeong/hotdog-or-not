import 'server-only';

import { type Database, HotdogTypes } from '@/shared/types';
import { ExpectedServerError, HTTP_STATUS } from '@/shared/utils/error';
import { getValidatedHotdogImageMediaType } from '@/shared/utils/hotdog';
import type { SupabaseClient } from '@supabase/supabase-js';
import type OpenAI from 'openai';

import type {
  GpsCoordinates,
  ReverseGeocodingClient,
} from '@/server/clients/geocoding/ReverseGeocoding.client';
import {
  STORAGE_BUCKET,
  type SupabaseStorageClient,
} from '@/server/clients/supabase/SupabaseStorage.client';
import { buildHotdogClassificationDetails } from './buildHotdogClassificationDetails';
import {
  createHotdogImageThumbnail,
  HOTDOG_IMAGE_THUMBNAIL_MEDIA_TYPE,
} from './createHotdogImageThumbnail';
import {
  createHotdogClassificationInstructions,
  HOTDOG_CLASSIFICATION_MODEL,
  HOTDOG_CLASSIFICATION_TEXT_FORMAT,
  type HotdogClassificationModelOutput,
} from './HotdogClassification.prompt';
import {
  createHotdogImageOriginalPath,
  createHotdogImageThumbnailPath,
  isGuestHotdogImagePath,
  isHotdogImagePathInStorageFolder,
} from './hotdogImagePath';
import { hotdogClassificationDetailsV1Schema } from './hotdogClassificationDetailsSchema';
import { createHotdogImageUrlMap } from './hotdogImageUrl';
import { readHotdogImageGpsCoordinates } from './readHotdogImageGpsCoordinates';
import { SANITIZED_HOTDOG_IMAGE_MEDIA_TYPE, sanitizeHotdogImage } from './sanitizeHotdogImage';

type HotdogClassificationRow = Database['public']['Tables']['hotdog_classifications']['Row'];
type HotdogClassificationInsert = Database['public']['Tables']['hotdog_classifications']['Insert'];

/** Postgres unique violation: `original_image_path` is unique. */
const UNIQUE_VIOLATION_ERROR_CODE = '23505';
/** Postgres foreign key violation: the visitor session was erased mid-classification. */
const FOREIGN_KEY_VIOLATION_ERROR_CODE = '23503';

interface TempImageFileInfo {
  byteSize: number;
  contentType: string;
}

/** A temp upload after the full check; only the sanitized bytes ever leave this service. */
interface AnalyzedHotdogImage {
  sanitizedImageBuffer: Buffer;
  hotdogClassification: HotdogTypes.HotdogClassification;
  details: HotdogTypes.HotdogClassificationDetails;
}

/**
 * Postgrest errors can echo row values (an FK violation's `details` names the session id,
 * a bearer secret), and anything thrown ends up in the logs: keep only the error code.
 */
const toLoggableDatabaseError = (operation: string, error: { code: string }) => {
  return new Error(`Hotdog classification ${operation} query failed (code: ${error.code})`);
};

/**
 * Only rows with a known schema version and a matching shape have readable details;
 * older or malformed rows are verdict-only.
 */
const readHotdogClassificationDetails = (
  hotdogClassificationRow: HotdogClassificationRow,
): HotdogTypes.HotdogClassificationDetails | null => {
  switch (hotdogClassificationRow.details_schema_version) {
    case HotdogTypes.HOTDOG_CLASSIFICATION_DETAILS_SCHEMA_VERSION: {
      const parsedDetails = hotdogClassificationDetailsV1Schema.safeParse(
        hotdogClassificationRow.details,
      );
      return parsedDetails.success ? parsedDetails.data : null;
    }
    default:
      return null;
  }
};

class HotdogClassificationService {
  private _openAIClient: OpenAI;
  private _supabaseClient: SupabaseClient<Database>;
  private _supabaseStorageClient: SupabaseStorageClient;
  private _reverseGeocodingClient: ReverseGeocodingClient;

  constructor({
    openAIClient,
    supabaseClient,
    supabaseStorageClient,
    reverseGeocodingClient,
  }: {
    openAIClient: OpenAI;
    supabaseClient: SupabaseClient<Database>;
    supabaseStorageClient: SupabaseStorageClient;
    reverseGeocodingClient: ReverseGeocodingClient;
  }) {
    this._openAIClient = openAIClient;
    this._supabaseClient = supabaseClient;
    this._supabaseStorageClient = supabaseStorageClient;
    this._reverseGeocodingClient = reverseGeocodingClient;
  }

  /** Same error for "not yours" and "gone" so other sessions' files are never revealed. */
  private _createExpiredUploadError = () => {
    return new ExpectedServerError({
      errorCode: 'UPLOAD_EXPIRED',
      httpStatusCode: HTTP_STATUS.NOT_FOUND,
    });
  };

  /** One structured call. The model only ever sees the sanitized image (no EXIF, no GPS). */
  private _askVisionModel = async ({
    sanitizedImageBuffer,
    locale,
  }: {
    sanitizedImageBuffer: Buffer;
    locale: HotdogTypes.HotdogClassificationLocale;
  }): Promise<HotdogClassificationModelOutput> => {
    const parsedResponse = await this._openAIClient.responses.parse({
      model: HOTDOG_CLASSIFICATION_MODEL,
      instructions: createHotdogClassificationInstructions(locale),
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_image',
              image_url: `data:${SANITIZED_HOTDOG_IMAGE_MEDIA_TYPE};base64,${sanitizedImageBuffer.toString('base64')}`,
              // Style, toppings and portion estimates need the full-resolution view.
              detail: 'high',
            },
          ],
        },
      ],
      text: { format: HOTDOG_CLASSIFICATION_TEXT_FORMAT },
    });
    const modelOutput = parsedResponse.output_parsed;

    if (!modelOutput) {
      throw new Error(`Hotdog classification returned no parsed output (id: ${parsedResponse.id})`);
    }

    // The verdict and the details must tell the same story; a mismatch is a retryable failure.
    if (modelOutput.isHotdog !== (modelOutput.details.kind === 'hotdog')) {
      throw new Error(
        `Hotdog classification verdict disagrees with its details (id: ${parsedResponse.id})`,
      );
    }
    return modelOutput;
  };

  /**
   * Best effort: no GPS, a timeout, or any geocoding error falls back to the model's style
   * guess. Logs never include the coordinates or the request URL.
   */
  private _findPhotoPlaceName = async (gpsCoordinates?: GpsCoordinates) => {
    if (!gpsCoordinates) {
      return undefined;
    }

    try {
      return await this._reverseGeocodingClient.findPlaceName(gpsCoordinates);
    } catch (error) {
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      console.warn(`Reverse geocoding failed (${errorName}); using the style guess instead.`);
      return undefined;
    }
  };

  /**
   * Data minimization: coordinates only leave the server (rounded, to Nominatim) when the
   * model saw a hotdog — the origin card is the only place they're used.
   */
  private _findHotdogPhotoPlaceName = ({
    modelOutput,
    gpsCoordinates,
  }: {
    modelOutput: HotdogClassificationModelOutput;
    gpsCoordinates?: GpsCoordinates;
  }) => {
    if (modelOutput.details.kind !== 'hotdog') {
      return undefined;
    }
    return this._findPhotoPlaceName(gpsCoordinates);
  };

  /**
   * Re-validate the real file → read GPS in memory → sanitize (drops all metadata) →
   * ask the model → reverse geocode (hotdogs only) → finish the details on the server.
   * Nothing is written here.
   */
  private _analyzeTempImage = async ({
    tempImagePath,
    tempImageFileInfo,
    locale,
  }: {
    tempImagePath: string;
    tempImageFileInfo: TempImageFileInfo;
    locale: HotdogTypes.HotdogClassificationLocale;
  }): Promise<AnalyzedHotdogImage> => {
    // The browser's claims at upload time aren't trusted; validate what was actually stored.
    getValidatedHotdogImageMediaType({
      mediaType: tempImageFileInfo.contentType,
      byteSize: tempImageFileInfo.byteSize,
    });
    const originalImageBuffer = await this._supabaseStorageClient.downloadFile({
      bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
      filePath: tempImagePath,
    });
    const gpsCoordinates = await readHotdogImageGpsCoordinates(originalImageBuffer);
    const sanitizedImageBuffer = await sanitizeHotdogImage(originalImageBuffer);

    // Checked before the paid model call: an image the bucket would reject can never be saved.
    if (sanitizedImageBuffer.byteLength > HotdogTypes.HOTDOG_IMAGE_MAX_BYTE_SIZE) {
      throw new ExpectedServerError({ errorCode: 'IMAGE_TOO_LARGE_TO_SAVE' });
    }

    const modelOutput = await this._askVisionModel({ sanitizedImageBuffer, locale });
    const photoPlaceName = await this._findHotdogPhotoPlaceName({ modelOutput, gpsCoordinates });
    return {
      sanitizedImageBuffer,
      hotdogClassification: { isHotdog: modelOutput.isHotdog, reason: modelOutput.reason },
      details: buildHotdogClassificationDetails({
        modelDetails: modelOutput.details,
        photoPlaceName,
      }),
    };
  };

  private _deleteTempImage = async (tempImagePath: string) => {
    await this._supabaseStorageClient.deleteFileList({
      bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
      filePathList: [tempImagePath],
    });
  };

  /** For when the answer is already decided; a leftover is caught by the scheduled temp cleanup. */
  private _deleteTempImageBestEffort = async (tempImagePath: string) => {
    await this._deleteTempImage(tempImagePath).catch((error: unknown) => {
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      console.warn(`Deleting a temp upload failed (${errorName}).`);
    });
  };

  /**
   * The raw upload may carry GPS, so it only stays while a retry can still use it:
   * a 4xx (unreadable, mislabeled, too large) can never succeed, so the file is deleted then.
   */
  private _analyzeOwnedTempImage = async ({
    tempImagePath,
    tempImageFileInfo,
    locale,
  }: {
    tempImagePath: string;
    tempImageFileInfo: TempImageFileInfo;
    locale: HotdogTypes.HotdogClassificationLocale;
  }): Promise<AnalyzedHotdogImage> => {
    try {
      return await this._analyzeTempImage({ tempImagePath, tempImageFileInfo, locale });
    } catch (error) {
      const isRetryableError =
        !(error instanceof ExpectedServerError) ||
        error.httpStatusCode >= HTTP_STATUS.INTERNAL_ERROR;

      if (!isRetryableError) {
        await this._deleteTempImageBestEffort(tempImagePath);
      }
      throw error;
    }
  };

  private _findHotdogClassificationRow = async ({
    visitorSessionId,
    originalImagePath,
  }: {
    visitorSessionId: string;
    originalImagePath: string;
  }) => {
    const { data: hotdogClassificationRow, error } = await this._supabaseClient
      .from('hotdog_classifications')
      .select('*')
      .eq('visitor_session_id', visitorSessionId)
      .eq('original_image_path', originalImagePath)
      .maybeSingle();

    if (error) {
      throw toLoggableDatabaseError('find', error);
    }
    return hotdogClassificationRow;
  };

  /**
   * A concurrent or repeated request for the same upload may have saved it already
   * (`original_image_path` is unique); that saved row is the answer, not an error.
   * `undefined` when the visitor session was erased meanwhile (erase-all during the check).
   */
  private _insertHotdogClassificationRow = async ({
    visitorSessionId,
    originalImagePath,
    thumbnailImagePath,
    analyzedHotdogImage,
  }: {
    visitorSessionId: string;
    originalImagePath: string;
    thumbnailImagePath: string;
    analyzedHotdogImage: AnalyzedHotdogImage;
  }): Promise<HotdogClassificationRow | undefined> => {
    const { hotdogClassification, details } = analyzedHotdogImage;
    const { data: hotdogClassificationRow, error } = await this._supabaseClient
      .from('hotdog_classifications')
      .insert({
        visitor_session_id: visitorSessionId,
        original_image_path: originalImagePath,
        thumbnail_image_path: thumbnailImagePath,
        is_hotdog: hotdogClassification.isHotdog,
        reason: hotdogClassification.reason,
        // Typed interfaces aren't assignable to the generated `Json` type; the shape is JSON-safe.
        details: details as unknown as HotdogClassificationInsert['details'],
        details_schema_version: HotdogTypes.HOTDOG_CLASSIFICATION_DETAILS_SCHEMA_VERSION,
      })
      .select('*')
      .single();

    if (error?.code === UNIQUE_VIOLATION_ERROR_CODE) {
      const savedHotdogClassificationRow = await this._findHotdogClassificationRow({
        visitorSessionId,
        originalImagePath,
      });

      if (!savedHotdogClassificationRow) {
        throw toLoggableDatabaseError('insert', error);
      }
      return savedHotdogClassificationRow;
    }

    if (error?.code === FOREIGN_KEY_VIOLATION_ERROR_CODE) {
      return undefined;
    }

    if (error) {
      throw toLoggableDatabaseError('insert', error);
    }
    return hotdogClassificationRow;
  };

  /** Erase-all ran mid-check: nothing may stay behind for a session that no longer exists. */
  private _discardOrphanedHotdogImages = async ({
    tempImagePath,
    originalImagePath,
    thumbnailImagePath,
  }: {
    tempImagePath: string;
    originalImagePath: string;
    thumbnailImagePath: string;
  }) => {
    await Promise.all([
      this._supabaseStorageClient.deleteFileList({
        bucketId: STORAGE_BUCKET.HOTDOG_IMAGES,
        filePathList: [originalImagePath, thumbnailImagePath],
      }),
      this._deleteTempImage(tempImagePath),
    ]).catch((error: unknown) => {
      const errorName = error instanceof Error ? error.name : 'UnknownError';
      console.warn(`Discarding images of an erased session failed (${errorName}).`);
    });
  };

  /**
   * One storage request signs every row's original and thumbnail; a missing object gets ''.
   * Rows saved before thumbnails existed show the original in lists.
   */
  private _toHotdogClassificationRecordList = async (
    hotdogClassificationRowList: HotdogClassificationRow[],
  ): Promise<HotdogTypes.HotdogClassificationRecord[]> => {
    const hotdogImageUrlMap = await createHotdogImageUrlMap({
      supabaseStorageClient: this._supabaseStorageClient,
      storageKeyList: hotdogClassificationRowList.flatMap(
        ({ original_image_path: originalImagePath, thumbnail_image_path: thumbnailImagePath }) =>
          thumbnailImagePath ? [originalImagePath, thumbnailImagePath] : [originalImagePath],
      ),
    });

    return hotdogClassificationRowList.map((hotdogClassificationRow) => {
      const { original_image_path: originalImagePath, thumbnail_image_path: thumbnailImagePath } =
        hotdogClassificationRow;
      const originalImageUrl = hotdogImageUrlMap.get(originalImagePath) ?? '';
      return {
        id: hotdogClassificationRow.id,
        isHotdog: hotdogClassificationRow.is_hotdog,
        reason: hotdogClassificationRow.reason,
        originalImageUrl,
        thumbnailImageUrl: thumbnailImagePath
          ? (hotdogImageUrlMap.get(thumbnailImagePath) ?? '')
          : originalImageUrl,
        createdAt: hotdogClassificationRow.created_at,
        details: readHotdogClassificationDetails(hotdogClassificationRow),
      };
    });
  };

  private _toHotdogClassificationRecord = async (
    hotdogClassificationRow: HotdogClassificationRow,
  ) => {
    const [hotdogClassificationRecord] = await this._toHotdogClassificationRecordList([
      hotdogClassificationRow,
    ]);
    return hotdogClassificationRecord;
  };

  private _getTempImageFileInfo = (tempImagePath: string) => {
    return this._supabaseStorageClient.getFileInfo({
      bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
      filePath: tempImagePath,
    });
  };

  /** The sanitized original and its thumbnail; both uploads overwrite on retry. */
  private _storeHotdogImages = async ({
    originalImagePath,
    thumbnailImagePath,
    analyzedHotdogImage,
  }: {
    originalImagePath: string;
    thumbnailImagePath: string;
    analyzedHotdogImage: AnalyzedHotdogImage;
  }) => {
    const { sanitizedImageBuffer } = analyzedHotdogImage;
    const thumbnailImageBuffer = await createHotdogImageThumbnail(sanitizedImageBuffer);
    await Promise.all([
      this._supabaseStorageClient.uploadFile({
        bucketId: STORAGE_BUCKET.HOTDOG_IMAGES,
        filePath: originalImagePath,
        fileBody: sanitizedImageBuffer,
        contentType: SANITIZED_HOTDOG_IMAGE_MEDIA_TYPE,
      }),
      this._supabaseStorageClient.uploadFile({
        bucketId: STORAGE_BUCKET.HOTDOG_IMAGES,
        filePath: thumbnailImagePath,
        fileBody: thumbnailImageBuffer,
        contentType: HOTDOG_IMAGE_THUMBNAIL_MEDIA_TYPE,
      }),
    ]);
  };

  /**
   * Visitor with history: analyze → store the sanitized original and its thumbnail
   * (destination bucket) → save the row → delete the temp upload. A retryable failure keeps
   * the temp file, so the client can retry with the same `tempImagePath`.
   * A repeated request for an upload that was already saved (e.g. the response or the temp
   * delete was lost) returns the saved record without asking the model again.
   */
  public classifyVisitorUploadedImage = async ({
    visitorSessionId,
    storageFolderId,
    tempImagePath,
    locale = 'en',
  }: {
    visitorSessionId: string;
    storageFolderId: string;
    tempImagePath: string;
    locale?: HotdogTypes.HotdogClassificationLocale;
  }): Promise<HotdogTypes.HotdogClassificationRecord> => {
    if (!isHotdogImagePathInStorageFolder({ hotdogImagePath: tempImagePath, storageFolderId })) {
      throw this._createExpiredUploadError();
    }

    const storedImagePaths = {
      originalImagePath: createHotdogImageOriginalPath(tempImagePath),
      thumbnailImagePath: createHotdogImageThumbnailPath(tempImagePath),
    };
    const savedHotdogClassificationRow = await this._findHotdogClassificationRow({
      visitorSessionId,
      originalImagePath: storedImagePaths.originalImagePath,
    });

    if (savedHotdogClassificationRow) {
      // The result is saved; a stuck temp delete must not fail the retry (the retention job cleans up).
      await this._deleteTempImageBestEffort(tempImagePath);
      return this._toHotdogClassificationRecord(savedHotdogClassificationRow);
    }

    const tempImageFileInfo = await this._getTempImageFileInfo(tempImagePath);

    if (!tempImageFileInfo) {
      throw this._createExpiredUploadError();
    }

    const analyzedHotdogImage = await this._analyzeOwnedTempImage({
      tempImagePath,
      tempImageFileInfo,
      locale,
    });
    await this._storeHotdogImages({ ...storedImagePaths, analyzedHotdogImage });
    const hotdogClassificationRow = await this._insertHotdogClassificationRow({
      visitorSessionId,
      ...storedImagePaths,
      analyzedHotdogImage,
    });

    if (!hotdogClassificationRow) {
      await this._discardOrphanedHotdogImages({ tempImagePath, ...storedImagePaths });
      throw this._createExpiredUploadError();
    }

    await this._deleteTempImage(tempImagePath);
    return this._toHotdogClassificationRecord(hotdogClassificationRow);
  };

  /**
   * Guest (no history consent): same check, nothing saved. The temp upload is deleted before
   * answering; a retryable failure keeps it so the client can retry.
   * The guest path itself is the proof of ownership (two random uuids).
   */
  public classifyGuestUploadedImage = async ({
    tempImagePath,
    locale = 'en',
  }: {
    tempImagePath: string;
    locale?: HotdogTypes.HotdogClassificationLocale;
  }): Promise<HotdogTypes.HotdogClassificationRecord> => {
    if (!isGuestHotdogImagePath(tempImagePath)) {
      throw this._createExpiredUploadError();
    }

    const tempImageFileInfo = await this._getTempImageFileInfo(tempImagePath);

    if (!tempImageFileInfo) {
      throw this._createExpiredUploadError();
    }

    const { hotdogClassification, details } = await this._analyzeOwnedTempImage({
      tempImagePath,
      tempImageFileInfo,
      locale,
    });
    // The result can't be fetched again, so a failed delete must not turn it into an error.
    await this._deleteTempImageBestEffort(tempImagePath);
    return {
      id: null,
      ...hotdogClassification,
      originalImageUrl: '',
      thumbnailImageUrl: '',
      createdAt: new Date().toISOString(),
      details,
    };
  };

  /** The visitor's most recent classifications, newest first. */
  public listHotdogClassifications = async ({
    visitorSessionId,
  }: {
    visitorSessionId: string;
  }): Promise<HotdogTypes.HotdogClassificationRecord[]> => {
    const { data: hotdogClassificationRowList, error } = await this._supabaseClient
      .from('hotdog_classifications')
      .select('*')
      .eq('visitor_session_id', visitorSessionId)
      .order('created_at', { ascending: false })
      .limit(HotdogTypes.HOTDOG_CLASSIFICATION_HISTORY_LIMIT);

    if (error) {
      throw toLoggableDatabaseError('list', error);
    }
    return this._toHotdogClassificationRecordList(hotdogClassificationRowList);
  };
}

export default HotdogClassificationService;
