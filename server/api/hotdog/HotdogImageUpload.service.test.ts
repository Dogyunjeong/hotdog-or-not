import { describe, expect, it, vi } from 'vitest';

import { STORAGE_BUCKET } from '@/server/clients/supabase/SupabaseStorage.client';
import { createFakeSupabaseStorageClient } from '@/test/helpers/createFakeSupabaseStorageClient';
import HotdogImageUploadService from './HotdogImageUpload.service';

const storageFolderId = '7c9d1e2f-3a4b-4c5d-8e6f-a1b2c3d4e5f6';

describe('HotdogImageUploadService', () => {
  it('signs an upload in the temp bucket under the visitor folder', async () => {
    const { supabaseStorageClient } = createFakeSupabaseStorageClient();
    const createSignedUploadUrl = vi.spyOn(supabaseStorageClient, 'createSignedUploadUrl');
    const hotdogImageUploadService = new HotdogImageUploadService({ supabaseStorageClient });

    const { tempImagePath } = await hotdogImageUploadService.createImageUploadSession({
      storageFolderId,
      mediaType: 'image/png',
      byteSize: 1024,
    });

    expect(tempImagePath).toMatch(new RegExp(`^${storageFolderId}/[0-9a-f-]{36}\\.png$`));
    expect(createSignedUploadUrl).toHaveBeenCalledWith({
      bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
      filePath: tempImagePath,
    });
  });
});
