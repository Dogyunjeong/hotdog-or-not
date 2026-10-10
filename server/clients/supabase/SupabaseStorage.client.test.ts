import { createFakeSupabaseStorageClient } from '@/test/helpers/createFakeSupabaseStorageClient';
import { describe, expect, it } from 'vitest';

import type { Database } from '@/shared/types';
import type { SupabaseClient } from '@supabase/supabase-js';

import { STORAGE_BUCKET, SupabaseStorageClient } from './SupabaseStorage.client';

const filePath = 'visitor-session-id/image.png';
const fileBody = Buffer.from([1, 2, 3]);

const createStorageWithTempFile = () => {
  const fakeStorage = createFakeSupabaseStorageClient();
  fakeStorage.putFile({
    bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
    filePath,
    body: fileBody,
    contentType: 'image/png',
  });
  return fakeStorage;
};

describe('SupabaseStorageClient', () => {
  it('creates a signed upload URL', async () => {
    const { supabaseStorageClient } = createFakeSupabaseStorageClient();

    const { signedUploadUrl } = await supabaseStorageClient.createSignedUploadUrl({
      bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
      filePath,
    });

    expect(signedUploadUrl).toContain(`${STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS}/${filePath}`);
  });

  it('returns file info, or undefined when the file is missing', async () => {
    const { supabaseStorageClient } = createStorageWithTempFile();

    await expect(
      supabaseStorageClient.getFileInfo({
        bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
        filePath,
      }),
    ).resolves.toEqual({ byteSize: 3, contentType: 'image/png' });
    await expect(
      supabaseStorageClient.getFileInfo({
        bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
        filePath: 'missing.png',
      }),
    ).resolves.toBe(undefined);
  });

  it('rethrows storage errors other than "not found" so the request stays retryable', async () => {
    const outageError = new Error('fetch failed');
    const supabaseClient = {
      storage: { from: () => ({ info: async () => ({ data: null, error: outageError }) }) },
    } as unknown as SupabaseClient<Database>;
    const supabaseStorageClient = new SupabaseStorageClient({ supabaseClient });

    await expect(
      supabaseStorageClient.getFileInfo({
        bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
        filePath,
      }),
    ).rejects.toBe(outageError);
  });

  it('downloads file bytes', async () => {
    const { supabaseStorageClient } = createStorageWithTempFile();

    const downloadedBuffer = await supabaseStorageClient.downloadFile({
      bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
      filePath,
    });

    expect(downloadedBuffer.equals(fileBody)).toBe(true);
  });

  it('moves a file across buckets', async () => {
    const { supabaseStorageClient, hasFile } = createStorageWithTempFile();

    await supabaseStorageClient.moveFile({
      sourceBucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
      sourceFilePath: filePath,
      destinationBucketId: STORAGE_BUCKET.HOTDOG_IMAGES,
      destinationFilePath: filePath,
    });

    expect(hasFile({ bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS, filePath })).toBe(false);
    expect(hasFile({ bucketId: STORAGE_BUCKET.HOTDOG_IMAGES, filePath })).toBe(true);
  });

  it('signs read URLs keyed by path, leaving out missing objects', async () => {
    const { supabaseStorageClient } = createStorageWithTempFile();

    const signedReadUrlMap = await supabaseStorageClient.createSignedReadUrlList({
      bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
      filePathList: [filePath, 'missing.png'],
      expiresInSeconds: 3600,
    });

    expect([...signedReadUrlMap.keys()]).toEqual([filePath]);
  });
});
