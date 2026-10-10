import { describe, expect, it } from 'vitest';

import { createFakeSupabaseStorageClient } from '../../../../test/helpers/createFakeSupabaseStorageClient.ts';
import { STORAGE_BUCKET } from './SupabaseStorage.client.ts';

const fileBody = Buffer.from([1, 2, 3]);

describe('SupabaseStorageClient', () => {
  it('uploads to the given bucket without overwriting', async () => {
    const { supabaseStorageClient, from, upload } = createFakeSupabaseStorageClient();

    await expect(
      supabaseStorageClient.uploadFile({
        bucketId: STORAGE_BUCKET.HOTDOG_IMAGES,
        filePath: '2026-10-10/image.png',
        fileBody,
        contentType: 'image/png',
      }),
    ).resolves.toEqual({ filePath: '2026-10-10/image.png' });
    expect(from).toHaveBeenCalledWith(STORAGE_BUCKET.HOTDOG_IMAGES);
    expect(upload).toHaveBeenCalledWith('2026-10-10/image.png', fileBody, {
      contentType: 'image/png',
      upsert: false,
    });
  });

  it('throws the storage error when the upload fails', async () => {
    const uploadError = new Error('bucket not found');
    const { supabaseStorageClient } = createFakeSupabaseStorageClient({ uploadError });

    await expect(
      supabaseStorageClient.uploadFile({
        bucketId: STORAGE_BUCKET.HOTDOG_IMAGES,
        filePath: 'image.png',
        fileBody,
        contentType: 'image/png',
      }),
    ).rejects.toBe(uploadError);
  });
});
