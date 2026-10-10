import 'server-only';

import { type Database, HotdogTypes } from '@/shared/types';
import { ExpectedServerError, HTTP_STATUS } from '@/shared/utils/error';
import { getValidatedHotdogImageMediaType } from '@/shared/utils/hotdog';
import type { SupabaseClient } from '@supabase/supabase-js';
import type OpenAI from 'openai';

import {
  STORAGE_BUCKET,
  type SupabaseStorageClient,
} from '@/server/clients/supabase/SupabaseStorage.client';
import {
  HOTDOG_CLASSIFICATION_INSTRUCTIONS,
  HOTDOG_CLASSIFICATION_MODEL,
  HOTDOG_CLASSIFICATION_TEXT_FORMAT,
} from './HotdogClassification.prompt';
import { isHotdogImagePathInStorageFolder } from './hotdogImagePath';

type HotdogClassificationRow = Database['public']['Tables']['hotdog_classifications']['Row'];

const HOTDOG_IMAGE_READ_URL_EXPIRES_IN_SECONDS = 60 * 60;

/** Same message for "not yours" and "gone" so other sessions' files are never revealed. */
const EXPIRED_UPLOAD_ERROR_MESSAGE = 'That upload has expired. Please pick your photo again.';

class HotdogClassificationService {
  private _openAIClient: OpenAI;
  private _supabaseClient: SupabaseClient<Database>;
  private _supabaseStorageClient: SupabaseStorageClient;

  constructor({
    openAIClient,
    supabaseClient,
    supabaseStorageClient,
  }: {
    openAIClient: OpenAI;
    supabaseClient: SupabaseClient<Database>;
    supabaseStorageClient: SupabaseStorageClient;
  }) {
    this._openAIClient = openAIClient;
    this._supabaseClient = supabaseClient;
    this._supabaseStorageClient = supabaseStorageClient;
  }

  private _createExpiredUploadError = () => {
    return new ExpectedServerError(EXPIRED_UPLOAD_ERROR_MESSAGE, HTTP_STATUS.NOT_FOUND);
  };

  private _askVisionModel = async (
    imageBuffer: Buffer,
    mediaType: HotdogTypes.HotdogImageMediaType,
  ): Promise<HotdogTypes.HotdogClassification> => {
    const parsedResponse = await this._openAIClient.responses.parse({
      model: HOTDOG_CLASSIFICATION_MODEL,
      instructions: HOTDOG_CLASSIFICATION_INSTRUCTIONS,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_image',
              image_url: `data:${mediaType};base64,${imageBuffer.toString('base64')}`,
              // Low detail is plenty to spot a hotdog and keeps cost and latency down.
              detail: 'low',
            },
          ],
        },
      ],
      text: { format: HOTDOG_CLASSIFICATION_TEXT_FORMAT },
    });

    if (!parsedResponse.output_parsed) {
      throw new Error(`Hotdog classification returned no parsed output (id: ${parsedResponse.id})`);
    }
    return parsedResponse.output_parsed;
  };

  private _insertHotdogClassificationRow = async ({
    visitorSessionId,
    imagePath,
    hotdogClassification,
  }: {
    visitorSessionId: string;
    imagePath: string;
    hotdogClassification: HotdogTypes.HotdogClassification;
  }) => {
    const { data: hotdogClassificationRow, error } = await this._supabaseClient
      .from('hotdog_classifications')
      .insert({
        visitor_session_id: visitorSessionId,
        image_path: imagePath,
        is_hotdog: hotdogClassification.isHotdog,
        reason: hotdogClassification.reason,
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }
    return hotdogClassificationRow;
  };

  private _findHotdogClassificationRow = async ({
    visitorSessionId,
    imagePath,
  }: {
    visitorSessionId: string;
    imagePath: string;
  }) => {
    const { data: hotdogClassificationRow, error } = await this._supabaseClient
      .from('hotdog_classifications')
      .select('*')
      .eq('visitor_session_id', visitorSessionId)
      .eq('image_path', imagePath)
      .maybeSingle();

    if (error) {
      throw error;
    }
    return hotdogClassificationRow;
  };

  /** One storage request signs every row's image; a missing image gets an empty URL. */
  private _toHotdogClassificationRecordList = async (
    hotdogClassificationRowList: HotdogClassificationRow[],
  ): Promise<HotdogTypes.HotdogClassificationRecord[]> => {
    const imageUrlByPath = await this._supabaseStorageClient.createSignedReadUrlList({
      bucketId: STORAGE_BUCKET.HOTDOG_IMAGES,
      filePathList: hotdogClassificationRowList.map(
        (hotdogClassificationRow) => hotdogClassificationRow.image_path,
      ),
      expiresInSeconds: HOTDOG_IMAGE_READ_URL_EXPIRES_IN_SECONDS,
    });

    return hotdogClassificationRowList.map((hotdogClassificationRow) => ({
      id: hotdogClassificationRow.id,
      isHotdog: hotdogClassificationRow.is_hotdog,
      reason: hotdogClassificationRow.reason,
      imageUrl: imageUrlByPath.get(hotdogClassificationRow.image_path) ?? '',
      createdAt: hotdogClassificationRow.created_at,
    }));
  };

  private _toHotdogClassificationRecord = async (
    hotdogClassificationRow: HotdogClassificationRow,
  ) => {
    const [hotdogClassificationRecord] = await this._toHotdogClassificationRecordList([
      hotdogClassificationRow,
    ]);
    return hotdogClassificationRecord;
  };

  /**
   * The temp file is gone once an upload is classified, so a repeated request (e.g. the
   * response was lost) returns the saved record instead of failing.
   */
  private _getAlreadyClassifiedImage = async ({
    visitorSessionId,
    tempImagePath,
  }: {
    visitorSessionId: string;
    tempImagePath: string;
  }) => {
    const hotdogClassificationRow = await this._findHotdogClassificationRow({
      visitorSessionId,
      imagePath: tempImagePath,
    });

    if (!hotdogClassificationRow) {
      throw this._createExpiredUploadError();
    }
    return this._toHotdogClassificationRecord(hotdogClassificationRow);
  };

  /**
   * Re-validate the real file → classify → move to the destination bucket → save.
   * Any failure before the move leaves the temp file in place, so the client can retry
   * with the same `tempImagePath`.
   */
  private _classifyTempImage = async ({
    visitorSessionId,
    tempImagePath,
    tempImageFileInfo,
  }: {
    visitorSessionId: string;
    tempImagePath: string;
    tempImageFileInfo: { byteSize: number; contentType: string };
  }) => {
    // The browser's claims at upload time aren't trusted; validate what was actually stored.
    const mediaType = getValidatedHotdogImageMediaType({
      mediaType: tempImageFileInfo.contentType,
      byteSize: tempImageFileInfo.byteSize,
    });
    const imageBuffer = await this._supabaseStorageClient.downloadFile({
      bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
      filePath: tempImagePath,
    });
    // TODO: sniff magic bytes so a mislabeled file can't pass as an image (content type is client-set).
    const hotdogClassification = await this._askVisionModel(imageBuffer, mediaType);

    await this._supabaseStorageClient.moveFile({
      sourceBucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
      sourceFilePath: tempImagePath,
      destinationBucketId: STORAGE_BUCKET.HOTDOG_IMAGES,
      destinationFilePath: tempImagePath,
    });
    const hotdogClassificationRow = await this._insertHotdogClassificationRow({
      visitorSessionId,
      imagePath: tempImagePath,
      hotdogClassification,
    });
    return this._toHotdogClassificationRecord(hotdogClassificationRow);
  };

  public classifyUploadedImage = async ({
    visitorSessionId,
    storageFolderId,
    tempImagePath,
  }: {
    visitorSessionId: string;
    storageFolderId: string;
    tempImagePath: string;
  }): Promise<HotdogTypes.HotdogClassificationRecord> => {
    if (!isHotdogImagePathInStorageFolder({ hotdogImagePath: tempImagePath, storageFolderId })) {
      throw this._createExpiredUploadError();
    }

    const tempImageFileInfo = await this._supabaseStorageClient.getFileInfo({
      bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
      filePath: tempImagePath,
    });

    if (!tempImageFileInfo) {
      return this._getAlreadyClassifiedImage({ visitorSessionId, tempImagePath });
    }
    return this._classifyTempImage({ visitorSessionId, tempImagePath, tempImageFileInfo });
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
      throw error;
    }
    return this._toHotdogClassificationRecordList(hotdogClassificationRowList);
  };
}

export default HotdogClassificationService;
