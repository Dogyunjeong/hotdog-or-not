import { describe, expect, it, vi } from 'vitest';

import { STORAGE_BUCKET } from '@/server/clients/supabase/SupabaseStorage.client';
import { createFakeHotdogClassificationSupabaseClient } from '@/test/helpers/createFakeHotdogClassificationSupabaseClient';
import { createFakeOpenAIClient } from '@/test/helpers/createFakeOpenAIClient';
import { createFakeSupabaseStorageClient } from '@/test/helpers/createFakeSupabaseStorageClient';
import HotdogClassificationService from './HotdogClassification.service';
import { createHotdogImagePath } from './hotdogImagePath';

const visitor = {
  visitorSessionId: '2b1e7c8a-4c2f-4f7e-9d3a-6a1b2c3d4e5f',
  storageFolderId: '7c9d1e2f-3a4b-4c5d-8e6f-a1b2c3d4e5f6',
};
const otherVisitor = {
  visitorSessionId: '9f8e7d6c-5b4a-4321-8fed-cba987654321',
  storageFolderId: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
};
const hotdogClassification = { isHotdog: true, reason: 'Classic ballpark dog.' };
const EXPIRED_UPLOAD_ERROR = {
  httpStatusCode: 404,
  message: 'That upload has expired. Please pick your photo again.',
};

const createHotdogClassificationService = ({ parseError }: { parseError?: Error } = {}) => {
  const { openAIClient, parse } = createFakeOpenAIClient({
    outputParsed: hotdogClassification,
    parseError,
  });
  const { supabaseClient, hotdogClassificationRowList } =
    createFakeHotdogClassificationSupabaseClient();
  const { supabaseStorageClient, putFile, hasFile } = createFakeSupabaseStorageClient();
  const moveFile = vi.spyOn(supabaseStorageClient, 'moveFile');
  const createSignedReadUrlList = vi.spyOn(supabaseStorageClient, 'createSignedReadUrlList');
  const hotdogClassificationService = new HotdogClassificationService({
    openAIClient,
    supabaseClient,
    supabaseStorageClient,
  });

  /** Simulates the browser's PUT to the signed upload URL. */
  const putTempImage = ({
    storageFolderId = visitor.storageFolderId,
    contentType = 'image/png',
  } = {}) => {
    const tempImagePath = createHotdogImagePath({ storageFolderId, mediaType: 'image/png' });
    putFile({
      bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
      filePath: tempImagePath,
      body: Buffer.alloc(16),
      contentType,
    });
    return tempImagePath;
  };

  return {
    hotdogClassificationService,
    hotdogClassificationRowList,
    parse,
    hasFile,
    moveFile,
    createSignedReadUrlList,
    putTempImage,
  };
};

describe('HotdogClassificationService.classifyUploadedImage', () => {
  it('classifies, moves the image to the destination bucket, and saves the record', async () => {
    const { hotdogClassificationService, hotdogClassificationRowList, hasFile, putTempImage } =
      createHotdogClassificationService();
    const tempImagePath = putTempImage();

    const hotdogClassificationRecord = await hotdogClassificationService.classifyUploadedImage({
      ...visitor,
      tempImagePath,
    });

    expect(hotdogClassificationRecord).toEqual({
      id: hotdogClassificationRowList[0].id,
      ...hotdogClassification,
      imageUrl: expect.stringContaining(`${STORAGE_BUCKET.HOTDOG_IMAGES}/${tempImagePath}`),
      createdAt: hotdogClassificationRowList[0].created_at,
    });
    expect(hotdogClassificationRowList[0]).toMatchObject({
      visitor_session_id: visitor.visitorSessionId,
      image_path: tempImagePath,
    });
    expect(
      hasFile({ bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS, filePath: tempImagePath }),
    ).toBe(false);
    expect(hasFile({ bucketId: STORAGE_BUCKET.HOTDOG_IMAGES, filePath: tempImagePath })).toBe(true);
  });

  it('returns the saved record when the same upload is classified again', async () => {
    const { hotdogClassificationService, hotdogClassificationRowList, parse, putTempImage } =
      createHotdogClassificationService();
    const tempImagePath = putTempImage();
    const hotdogClassificationRecord = await hotdogClassificationService.classifyUploadedImage({
      ...visitor,
      tempImagePath,
    });

    await expect(
      hotdogClassificationService.classifyUploadedImage({ ...visitor, tempImagePath }),
    ).resolves.toEqual(hotdogClassificationRecord);
    expect(parse).toHaveBeenCalledOnce();
    expect(hotdogClassificationRowList).toHaveLength(1);
  });

  it("returns 404 for another visitor's upload without calling the model", async () => {
    const { hotdogClassificationService, parse, putTempImage } =
      createHotdogClassificationService();
    const otherVisitorTempImagePath = putTempImage({
      storageFolderId: otherVisitor.storageFolderId,
    });

    await expect(
      hotdogClassificationService.classifyUploadedImage({
        ...visitor,
        tempImagePath: otherVisitorTempImagePath,
      }),
    ).rejects.toMatchObject(EXPIRED_UPLOAD_ERROR);
    expect(parse).not.toHaveBeenCalled();
  });

  it('returns 404 when the temp file is missing and was never classified', async () => {
    const { hotdogClassificationService } = createHotdogClassificationService();

    await expect(
      hotdogClassificationService.classifyUploadedImage({
        ...visitor,
        tempImagePath: createHotdogImagePath({
          storageFolderId: visitor.storageFolderId,
          mediaType: 'image/png',
        }),
      }),
    ).rejects.toMatchObject(EXPIRED_UPLOAD_ERROR);
  });

  it('re-validates the stored file itself before classifying', async () => {
    const { hotdogClassificationService, parse, putTempImage } =
      createHotdogClassificationService();
    const tempImagePath = putTempImage({ contentType: 'application/pdf' });

    await expect(
      hotdogClassificationService.classifyUploadedImage({ ...visitor, tempImagePath }),
    ).rejects.toMatchObject({ httpStatusCode: 400 });
    expect(parse).not.toHaveBeenCalled();
  });

  it('keeps the temp file and saves nothing when the model fails', async () => {
    const parseError = new Error('model down');
    const {
      hotdogClassificationService,
      hotdogClassificationRowList,
      hasFile,
      moveFile,
      putTempImage,
    } = createHotdogClassificationService({ parseError });
    const tempImagePath = putTempImage();

    await expect(
      hotdogClassificationService.classifyUploadedImage({ ...visitor, tempImagePath }),
    ).rejects.toBe(parseError);
    expect(moveFile).not.toHaveBeenCalled();
    expect(hotdogClassificationRowList).toEqual([]);
    expect(
      hasFile({ bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS, filePath: tempImagePath }),
    ).toBe(true);
  });
});

describe('HotdogClassificationService.listHotdogClassifications', () => {
  it("lists only the visitor's records, newest first, signed in one batch", async () => {
    const { hotdogClassificationService, createSignedReadUrlList, putTempImage } =
      createHotdogClassificationService();
    const classifyNewImage = (classifyingVisitor: typeof visitor) =>
      hotdogClassificationService.classifyUploadedImage({
        ...classifyingVisitor,
        tempImagePath: putTempImage({ storageFolderId: classifyingVisitor.storageFolderId }),
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
});
