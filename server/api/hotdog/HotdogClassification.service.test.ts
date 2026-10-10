import sharp from 'sharp';
import { describe, expect, it, vi } from 'vitest';

import { STORAGE_BUCKET } from '@/server/clients/supabase/SupabaseStorage.client';
import { HotdogTypes } from '@/shared/types';
import { createFakeHotdogClassificationSupabaseClient } from '@/test/helpers/createFakeHotdogClassificationSupabaseClient';
import { createFakeOpenAIClient } from '@/test/helpers/createFakeOpenAIClient';
import { createFakeReverseGeocodingClient } from '@/test/helpers/createFakeReverseGeocodingClient';
import { createFakeSupabaseStorageClient } from '@/test/helpers/createFakeSupabaseStorageClient';
import { createTestHotdogImageBuffer } from '@/test/helpers/createTestHotdogImageBuffer';
import {
  HOTDOG_MODEL_OUTPUT,
  NOT_HOTDOG_FOOD_MODEL_OUTPUT,
} from '@/test/helpers/hotdogClassificationModelOutput';
import HotdogClassificationService from './HotdogClassification.service';
import {
  createGuestHotdogImagePath,
  createHotdogImageOriginalPath,
  createHotdogImagePath,
  createHotdogImageThumbnailPath,
} from './hotdogImagePath';
import { sanitizeHotdogImage } from './sanitizeHotdogImage';

// Real sanitizing by default; one test swaps in an oversized result.
vi.mock('./sanitizeHotdogImage', async (importOriginal) => {
  const sanitizeHotdogImageModule = await importOriginal<typeof import('./sanitizeHotdogImage')>();
  return {
    ...sanitizeHotdogImageModule,
    sanitizeHotdogImage: vi.fn(sanitizeHotdogImageModule.sanitizeHotdogImage),
  };
});

const visitor = {
  visitorSessionId: '2b1e7c8a-4c2f-4f7e-9d3a-6a1b2c3d4e5f',
  storageFolderId: '7c9d1e2f-3a4b-4c5d-8e6f-a1b2c3d4e5f6',
};
const otherVisitor = {
  visitorSessionId: '9f8e7d6c-5b4a-4321-8fed-cba987654321',
  storageFolderId: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
};
const photoGpsCoordinates = { latitude: 51.5079, longitude: -0.0877 };
const PHOTO_PLACE_NAME = 'London, England, United Kingdom';
const EXPIRED_UPLOAD_ERROR = {
  httpStatusCode: 404,
  message: 'That upload has expired. Please pick your photo again.',
};

const createHotdogClassificationService = ({
  modelOutput = HOTDOG_MODEL_OUTPUT,
  parseError,
  findPlaceNameError,
  insertError,
}: {
  modelOutput?: unknown;
  parseError?: Error;
  findPlaceNameError?: Error;
  insertError?: Error;
} = {}) => {
  const { openAIClient, parse, getSentImageBufferList } = createFakeOpenAIClient({
    outputParsed: modelOutput,
    parseError,
  });
  const { supabaseClient, hotdogClassificationRowList } =
    createFakeHotdogClassificationSupabaseClient({ insertError });
  const { supabaseStorageClient, putFile, hasFile } = createFakeSupabaseStorageClient();
  const { reverseGeocodingClient, findPlaceName } = createFakeReverseGeocodingClient({
    placeName: PHOTO_PLACE_NAME,
    findPlaceNameError,
  });
  const uploadFile = vi.spyOn(supabaseStorageClient, 'uploadFile');
  const createSignedReadUrlList = vi.spyOn(supabaseStorageClient, 'createSignedReadUrlList');
  const hotdogClassificationService = new HotdogClassificationService({
    openAIClient,
    supabaseClient,
    supabaseStorageClient,
    reverseGeocodingClient,
  });

  /** Simulates the browser's PUT to the signed upload URL. */
  const putTempImage = async ({
    tempImagePath = createHotdogImagePath({
      storageFolderId: visitor.storageFolderId,
      mediaType: 'image/jpeg',
    }),
    contentType = 'image/jpeg',
    body,
  }: { tempImagePath?: string; contentType?: string; body?: Buffer } = {}) => {
    putFile({
      bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
      filePath: tempImagePath,
      body: body ?? (await createTestHotdogImageBuffer({ gpsCoordinates: photoGpsCoordinates })),
      contentType,
    });
    return tempImagePath;
  };

  const hasTempImage = (tempImagePath: string) =>
    hasFile({ bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS, filePath: tempImagePath });

  return {
    hotdogClassificationService,
    hotdogClassificationRowList,
    supabaseStorageClient,
    parse,
    getSentImageBufferList,
    findPlaceName,
    putFile,
    hasFile,
    hasTempImage,
    uploadFile,
    createSignedReadUrlList,
    putTempImage,
  };
};

describe('HotdogClassificationService.classifyVisitorUploadedImage', () => {
  it('stores the sanitized image and details, and never stores or sends the GPS position', async () => {
    const {
      hotdogClassificationService,
      hotdogClassificationRowList,
      getSentImageBufferList,
      findPlaceName,
      hasFile,
      hasTempImage,
      uploadFile,
      putTempImage,
    } = createHotdogClassificationService();
    const tempImagePath = await putTempImage();
    const originalImagePath = createHotdogImageOriginalPath(tempImagePath);

    const hotdogClassificationRecord =
      await hotdogClassificationService.classifyVisitorUploadedImage({
        ...visitor,
        tempImagePath,
      });

    expect(originalImagePath).toBe(tempImagePath.replace(/\.jpg$/, '.webp'));
    expect(hotdogClassificationRecord).toMatchObject({
      id: hotdogClassificationRowList[0].id,
      isHotdog: true,
      reason: HOTDOG_MODEL_OUTPUT.reason,
      originalImageUrl: expect.stringContaining(
        `${STORAGE_BUCKET.HOTDOG_IMAGES}/${originalImagePath}`,
      ),
      createdAt: hotdogClassificationRowList[0].created_at,
      details: {
        kind: 'hotdog',
        origin: { source: 'photoLocation', placeName: PHOTO_PLACE_NAME },
      },
    });
    expect(hotdogClassificationRowList[0]).toMatchObject({
      visitor_session_id: visitor.visitorSessionId,
      original_image_path: originalImagePath,
      details: hotdogClassificationRecord.details,
      details_schema_version: HotdogTypes.HOTDOG_CLASSIFICATION_DETAILS_SCHEMA_VERSION,
    });
    expect(findPlaceName).toHaveBeenCalledWith(photoGpsCoordinates);

    const [originalUpload] = uploadFile.mock.calls
      .map(([fileUpload]) => fileUpload)
      .filter(({ filePath }) => filePath === originalImagePath);
    const [sentImageBuffer] = getSentImageBufferList();
    expect(originalUpload.fileBody).toEqual(sentImageBuffer);
    expect(originalUpload.contentType).toBe('image/webp');
    const sentImageMetadata = await sharp(sentImageBuffer).metadata();
    expect(sentImageMetadata.format).toBe('webp');
    expect(sentImageMetadata.exif).toBeUndefined();

    const savedJson = JSON.stringify([hotdogClassificationRecord, hotdogClassificationRowList]);
    expect(savedJson).not.toMatch(/51\.50|0\.08|latitude|longitude/);
    expect(hasFile({ bucketId: STORAGE_BUCKET.HOTDOG_IMAGES, filePath: originalImagePath })).toBe(
      true,
    );
    expect(hasTempImage(tempImagePath)).toBe(false);
  });

  it('stores a small metadata-free WebP thumbnail next to the original, signed in one batch', async () => {
    const {
      hotdogClassificationService,
      hotdogClassificationRowList,
      uploadFile,
      createSignedReadUrlList,
      putTempImage,
    } = createHotdogClassificationService();
    const tempImagePath = await putTempImage({
      body: await createTestHotdogImageBuffer({
        widthPixels: 800,
        heightPixels: 600,
        gpsCoordinates: photoGpsCoordinates,
      }),
    });
    const originalImagePath = createHotdogImageOriginalPath(tempImagePath);
    const thumbnailImagePath = createHotdogImageThumbnailPath(tempImagePath);

    const hotdogClassificationRecord =
      await hotdogClassificationService.classifyVisitorUploadedImage({
        ...visitor,
        tempImagePath,
      });

    expect(thumbnailImagePath).toBe(tempImagePath.replace(/\.jpg$/, '.thumbnail.webp'));
    expect(hotdogClassificationRowList[0]).toMatchObject({
      original_image_path: originalImagePath,
      thumbnail_image_path: thumbnailImagePath,
    });
    const [thumbnailUpload] = uploadFile.mock.calls
      .map(([fileUpload]) => fileUpload)
      .filter(({ filePath }) => filePath === thumbnailImagePath);
    expect(thumbnailUpload.contentType).toBe('image/webp');
    const thumbnailMetadata = await sharp(thumbnailUpload.fileBody).metadata();
    expect(thumbnailMetadata).toMatchObject({ format: 'webp', width: 320, height: 240 });
    expect(thumbnailMetadata.exif).toBeUndefined();

    expect(createSignedReadUrlList).toHaveBeenCalledOnce();
    expect(createSignedReadUrlList.mock.calls[0][0].filePathList).toEqual([
      originalImagePath,
      thumbnailImagePath,
    ]);
    expect(hotdogClassificationRecord).toMatchObject({
      originalImageUrl: expect.stringContaining(originalImagePath),
      thumbnailImageUrl: expect.stringContaining(thumbnailImagePath),
    });
  });

  it('rejects an image still too large after sanitizing, before the model or any write, and deletes the upload', async () => {
    const {
      hotdogClassificationService,
      hotdogClassificationRowList,
      parse,
      uploadFile,
      hasTempImage,
      putTempImage,
    } = createHotdogClassificationService();
    vi.mocked(sanitizeHotdogImage).mockResolvedValueOnce(
      Buffer.alloc(HotdogTypes.HOTDOG_IMAGE_MAX_BYTE_SIZE + 1),
    );
    const tempImagePath = await putTempImage();

    await expect(
      hotdogClassificationService.classifyVisitorUploadedImage({ ...visitor, tempImagePath }),
    ).rejects.toMatchObject({
      httpStatusCode: 400,
      message: 'This photo is too large to save. Please try a smaller one.',
    });
    expect(parse).not.toHaveBeenCalled();
    expect(uploadFile).not.toHaveBeenCalled();
    expect(hotdogClassificationRowList).toEqual([]);
    expect(hasTempImage(tempImagePath)).toBe(false);
  });

  it('never sends the photo location anywhere when the photo is not a hotdog', async () => {
    const { hotdogClassificationService, findPlaceName, putTempImage } =
      createHotdogClassificationService({ modelOutput: NOT_HOTDOG_FOOD_MODEL_OUTPUT });
    const tempImagePath = await putTempImage();

    await hotdogClassificationService.classifyVisitorUploadedImage({ ...visitor, tempImagePath });

    expect(findPlaceName).not.toHaveBeenCalled();
  });

  it('falls back to the style guess when reverse geocoding fails', async () => {
    const { hotdogClassificationService, putTempImage } = createHotdogClassificationService({
      findPlaceNameError: new DOMException('The operation timed out.', 'TimeoutError'),
    });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const tempImagePath = await putTempImage();

    const { details } = await hotdogClassificationService.classifyVisitorUploadedImage({
      ...visitor,
      tempImagePath,
    });

    expect(details).toMatchObject({
      origin: { source: 'styleGuess', placeName: 'Chicago, Illinois, United States' },
    });
  });

  it('returns the saved record when the same upload is classified again', async () => {
    const { hotdogClassificationService, hotdogClassificationRowList, parse, putTempImage } =
      createHotdogClassificationService();
    const tempImagePath = await putTempImage();
    const hotdogClassificationRecord =
      await hotdogClassificationService.classifyVisitorUploadedImage({
        ...visitor,
        tempImagePath,
      });

    await expect(
      hotdogClassificationService.classifyVisitorUploadedImage({ ...visitor, tempImagePath }),
    ).resolves.toEqual(hotdogClassificationRecord);
    expect(parse).toHaveBeenCalledOnce();
    expect(hotdogClassificationRowList).toHaveLength(1);
  });

  it('returns the saved record without asking the model again when the temp delete failed', async () => {
    const {
      hotdogClassificationService,
      hotdogClassificationRowList,
      supabaseStorageClient,
      parse,
      hasTempImage,
      putTempImage,
    } = createHotdogClassificationService();
    vi.spyOn(supabaseStorageClient, 'deleteFileList').mockRejectedValueOnce(
      new Error('storage down'),
    );
    const tempImagePath = await putTempImage();

    await expect(
      hotdogClassificationService.classifyVisitorUploadedImage({ ...visitor, tempImagePath }),
    ).rejects.toThrow('storage down');
    const retriedRecord = await hotdogClassificationService.classifyVisitorUploadedImage({
      ...visitor,
      tempImagePath,
    });

    expect(retriedRecord.id).toBe(hotdogClassificationRowList[0].id);
    expect(parse).toHaveBeenCalledOnce();
    expect(hasTempImage(tempImagePath)).toBe(false);
  });

  it('returns the row a concurrent request saved first for the same upload', async () => {
    const { hotdogClassificationService, hotdogClassificationRowList, parse, putTempImage } =
      createHotdogClassificationService();
    const tempImagePath = await putTempImage();
    const concurrentlySavedRowId = crypto.randomUUID();
    // The other request saves its row while this one waits for the model.
    parse.mockImplementationOnce(async () => {
      hotdogClassificationRowList.push({
        id: concurrentlySavedRowId,
        visitor_session_id: visitor.visitorSessionId,
        image_path: null,
        original_image_path: createHotdogImageOriginalPath(tempImagePath),
        thumbnail_image_path: createHotdogImageThumbnailPath(tempImagePath),
        is_hotdog: true,
        reason: HOTDOG_MODEL_OUTPUT.reason,
        created_at: '2026-10-10T12:00:00.000Z',
        details: null,
        details_schema_version: null,
      });
      return { id: 'resp_test', output_parsed: HOTDOG_MODEL_OUTPUT };
    });

    const hotdogClassificationRecord =
      await hotdogClassificationService.classifyVisitorUploadedImage({ ...visitor, tempImagePath });

    expect(hotdogClassificationRecord.id).toBe(concurrentlySavedRowId);
    expect(hotdogClassificationRowList).toHaveLength(1);
  });

  it('leaves nothing behind when the session is erased during the check', async () => {
    const {
      hotdogClassificationService,
      hotdogClassificationRowList,
      hasFile,
      hasTempImage,
      putTempImage,
    } = createHotdogClassificationService({
      insertError: Object.assign(new Error('violates foreign key constraint'), { code: '23503' }),
    });
    const tempImagePath = await putTempImage();

    await expect(
      hotdogClassificationService.classifyVisitorUploadedImage({ ...visitor, tempImagePath }),
    ).rejects.toMatchObject(EXPIRED_UPLOAD_ERROR);
    expect(hotdogClassificationRowList).toEqual([]);
    expect(
      [
        createHotdogImageOriginalPath(tempImagePath),
        createHotdogImageThumbnailPath(tempImagePath),
      ].some((storedImagePath) =>
        hasFile({ bucketId: STORAGE_BUCKET.HOTDOG_IMAGES, filePath: storedImagePath }),
      ),
    ).toBe(false);
    expect(hasTempImage(tempImagePath)).toBe(false);
  });

  it("returns 404 for another visitor's or a guest's upload without calling the model", async () => {
    const { hotdogClassificationService, parse, putTempImage } =
      createHotdogClassificationService();
    const otherVisitorTempImagePath = await putTempImage({
      tempImagePath: createHotdogImagePath({
        storageFolderId: otherVisitor.storageFolderId,
        mediaType: 'image/jpeg',
      }),
    });
    const guestTempImagePath = await putTempImage({
      tempImagePath: createGuestHotdogImagePath({ mediaType: 'image/jpeg' }),
    });

    await expect(
      hotdogClassificationService.classifyVisitorUploadedImage({
        ...visitor,
        tempImagePath: otherVisitorTempImagePath,
      }),
    ).rejects.toMatchObject(EXPIRED_UPLOAD_ERROR);
    await expect(
      hotdogClassificationService.classifyVisitorUploadedImage({
        ...visitor,
        tempImagePath: guestTempImagePath,
      }),
    ).rejects.toMatchObject(EXPIRED_UPLOAD_ERROR);
    expect(parse).not.toHaveBeenCalled();
  });

  it('returns 404 when the temp file is missing and was never classified', async () => {
    const { hotdogClassificationService } = createHotdogClassificationService();

    await expect(
      hotdogClassificationService.classifyVisitorUploadedImage({
        ...visitor,
        tempImagePath: createHotdogImagePath({
          storageFolderId: visitor.storageFolderId,
          mediaType: 'image/jpeg',
        }),
      }),
    ).rejects.toMatchObject(EXPIRED_UPLOAD_ERROR);
  });

  it('re-validates the stored file itself and deletes uploads that can never succeed', async () => {
    const { hotdogClassificationService, parse, hasTempImage, putTempImage } =
      createHotdogClassificationService();
    const mislabeledTempImagePath = await putTempImage({ contentType: 'application/pdf' });
    const unreadableTempImagePath = await putTempImage({ body: Buffer.alloc(16) });

    await expect(
      hotdogClassificationService.classifyVisitorUploadedImage({
        ...visitor,
        tempImagePath: mislabeledTempImagePath,
      }),
    ).rejects.toMatchObject({ httpStatusCode: 400 });
    await expect(
      hotdogClassificationService.classifyVisitorUploadedImage({
        ...visitor,
        tempImagePath: unreadableTempImagePath,
      }),
    ).rejects.toMatchObject({ httpStatusCode: 400 });
    expect(parse).not.toHaveBeenCalled();
    expect(hasTempImage(mislabeledTempImagePath)).toBe(false);
    expect(hasTempImage(unreadableTempImagePath)).toBe(false);
  });

  it('keeps the temp file and saves nothing when the model fails', async () => {
    const parseError = new Error('model down');
    const {
      hotdogClassificationService,
      hotdogClassificationRowList,
      hasTempImage,
      uploadFile,
      putTempImage,
    } = createHotdogClassificationService({ parseError });
    const tempImagePath = await putTempImage();

    await expect(
      hotdogClassificationService.classifyVisitorUploadedImage({ ...visitor, tempImagePath }),
    ).rejects.toBe(parseError);
    expect(uploadFile).not.toHaveBeenCalled();
    expect(hotdogClassificationRowList).toEqual([]);
    expect(hasTempImage(tempImagePath)).toBe(true);
  });

  it('rejects a model answer whose verdict disagrees with its details', async () => {
    const { hotdogClassificationService, hasTempImage, putTempImage } =
      createHotdogClassificationService({
        modelOutput: { ...NOT_HOTDOG_FOOD_MODEL_OUTPUT, isHotdog: true },
      });
    const tempImagePath = await putTempImage();

    await expect(
      hotdogClassificationService.classifyVisitorUploadedImage({ ...visitor, tempImagePath }),
    ).rejects.toThrow('disagrees');
    expect(hasTempImage(tempImagePath)).toBe(true);
  });
});

describe('HotdogClassificationService.classifyGuestUploadedImage', () => {
  it('returns an unsaved result and deletes the temp upload', async () => {
    const {
      hotdogClassificationService,
      hotdogClassificationRowList,
      hasFile,
      hasTempImage,
      uploadFile,
      putTempImage,
    } = createHotdogClassificationService({ modelOutput: NOT_HOTDOG_FOOD_MODEL_OUTPUT });
    const tempImagePath = await putTempImage({
      tempImagePath: createGuestHotdogImagePath({ mediaType: 'image/jpeg' }),
    });

    const hotdogClassificationRecord = await hotdogClassificationService.classifyGuestUploadedImage(
      { tempImagePath },
    );

    expect(hotdogClassificationRecord).toEqual({
      id: null,
      isHotdog: false,
      reason: NOT_HOTDOG_FOOD_MODEL_OUTPUT.reason,
      originalImageUrl: '',
      thumbnailImageUrl: '',
      createdAt: expect.any(String),
      details: expect.objectContaining({ kind: 'notHotdog' }),
    });
    expect(hotdogClassificationRowList).toEqual([]);
    expect(uploadFile).not.toHaveBeenCalled();
    expect(hasFile({ bucketId: STORAGE_BUCKET.HOTDOG_IMAGES, filePath: tempImagePath })).toBe(
      false,
    );
    expect(hasTempImage(tempImagePath)).toBe(false);
  });

  it("returns 404 for a visitor's upload path", async () => {
    const { hotdogClassificationService, parse, putTempImage } =
      createHotdogClassificationService();
    const visitorTempImagePath = await putTempImage();

    await expect(
      hotdogClassificationService.classifyGuestUploadedImage({
        tempImagePath: visitorTempImagePath,
      }),
    ).rejects.toMatchObject(EXPIRED_UPLOAD_ERROR);
    expect(parse).not.toHaveBeenCalled();
  });
});

describe('HotdogClassificationService.listHotdogClassifications', () => {
  it("lists only the visitor's records, newest first, signed in one batch", async () => {
    const { hotdogClassificationService, createSignedReadUrlList, putTempImage } =
      createHotdogClassificationService();
    const classifyNewImage = async (classifyingVisitor: typeof visitor) =>
      hotdogClassificationService.classifyVisitorUploadedImage({
        ...classifyingVisitor,
        tempImagePath: await putTempImage({
          tempImagePath: createHotdogImagePath({
            storageFolderId: classifyingVisitor.storageFolderId,
            mediaType: 'image/jpeg',
          }),
        }),
      });
    const firstRecord = await classifyNewImage(visitor);
    await classifyNewImage(otherVisitor);
    const secondRecord = await classifyNewImage(visitor);
    createSignedReadUrlList.mockClear();

    const hotdogClassificationList = await hotdogClassificationService.listHotdogClassifications({
      visitorSessionId: visitor.visitorSessionId,
    });

    expect(hotdogClassificationList).toEqual([secondRecord, firstRecord]);
    expect(createSignedReadUrlList).toHaveBeenCalledOnce();
  });

  it('returns rows saved before v0.3 without details, showing the original as thumbnail', async () => {
    const { hotdogClassificationService, hotdogClassificationRowList, putFile } =
      createHotdogClassificationService();
    const legacyImagePath = createHotdogImagePath({
      storageFolderId: visitor.storageFolderId,
      mediaType: 'image/jpeg',
    });
    putFile({
      bucketId: STORAGE_BUCKET.HOTDOG_IMAGES,
      filePath: legacyImagePath,
      body: await createTestHotdogImageBuffer(),
      contentType: 'image/jpeg',
    });
    hotdogClassificationRowList.push({
      id: crypto.randomUUID(),
      visitor_session_id: visitor.visitorSessionId,
      image_path: null,
      thumbnail_image_path: null,
      original_image_path: legacyImagePath,
      is_hotdog: true,
      reason: 'Saved before details existed.',
      created_at: '2026-01-01T00:00:00.000Z',
      details: null,
      details_schema_version: null,
    });

    const [legacyRecord] = await hotdogClassificationService.listHotdogClassifications({
      visitorSessionId: visitor.visitorSessionId,
    });

    expect(legacyRecord).toMatchObject({ reason: 'Saved before details existed.', details: null });
    expect(legacyRecord.originalImageUrl).toContain(legacyImagePath);
    expect(legacyRecord.thumbnailImageUrl).toBe(legacyRecord.originalImageUrl);
  });

  it('renders a row whose stored details no longer match schema v1 verdict-only', async () => {
    const { hotdogClassificationService, hotdogClassificationRowList } =
      createHotdogClassificationService();
    hotdogClassificationRowList.push({
      id: crypto.randomUUID(),
      visitor_session_id: visitor.visitorSessionId,
      image_path: null,
      original_image_path: createHotdogImagePath({
        storageFolderId: visitor.storageFolderId,
        mediaType: 'image/jpeg',
      }),
      thumbnail_image_path: null,
      is_hotdog: true,
      reason: 'Details got mangled.',
      created_at: '2026-01-01T00:00:00.000Z',
      details: { kind: 'hotdog', hotdogCount: 'two' },
      details_schema_version: HotdogTypes.HOTDOG_CLASSIFICATION_DETAILS_SCHEMA_VERSION,
    });

    const [malformedRecord] = await hotdogClassificationService.listHotdogClassifications({
      visitorSessionId: visitor.visitorSessionId,
    });

    expect(malformedRecord).toMatchObject({ reason: 'Details got mangled.', details: null });
  });
});
