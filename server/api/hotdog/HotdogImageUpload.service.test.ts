import { describe, expect, it, vi } from 'vitest';

import { STORAGE_BUCKET } from '@/server/clients/supabase/SupabaseStorage.client';
import { createFakeSupabaseStorageClient } from '@/test/helpers/createFakeSupabaseStorageClient';
import { isGuestHotdogImagePath } from './hotdogImagePath';
import HotdogImageUploadService from './HotdogImageUpload.service';

const storageFolderId = '7c9d1e2f-3a4b-4c5d-8e6f-a1b2c3d4e5f6';

const createHotdogImageUploadService = () => {
  const { supabaseStorageClient } = createFakeSupabaseStorageClient();
  const createSignedUploadUrl = vi.spyOn(supabaseStorageClient, 'createSignedUploadUrl');
  const hotdogImageUploadService = new HotdogImageUploadService({ supabaseStorageClient });
  return { hotdogImageUploadService, createSignedUploadUrl };
};

describe('HotdogImageUploadService', () => {
  it('signs an upload in the temp bucket under the visitor folder', async () => {
    const { hotdogImageUploadService, createSignedUploadUrl } = createHotdogImageUploadService();

    const { tempImagePath } = await hotdogImageUploadService.createImageUploadSession({
      visitorStorageFolderId: storageFolderId,
      mediaType: 'image/png',
      byteSize: 1024,
    });

    expect(tempImagePath).toMatch(new RegExp(`^${storageFolderId}/[0-9a-f-]{36}\\.png$`));
    expect(createSignedUploadUrl).toHaveBeenCalledWith({
      bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
      filePath: tempImagePath,
    });
  });

  it('signs a guest upload under its own random guest folder', async () => {
    const { hotdogImageUploadService } = createHotdogImageUploadService();
    const createGuestUpload = () =>
      hotdogImageUploadService.createImageUploadSession({ mediaType: 'image/png', byteSize: 1024 });

    const [firstGuestUpload, secondGuestUpload] = await Promise.all([
      createGuestUpload(),
      createGuestUpload(),
    ]);

    expect(isGuestHotdogImagePath(firstGuestUpload.tempImagePath)).toBe(true);
    expect(firstGuestUpload.tempImagePath.split('/')[1]).not.toBe(
      secondGuestUpload.tempImagePath.split('/')[1],
    );
  });
});
