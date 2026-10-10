import 'server-only';

import type { HotdogTypes } from '@/shared/types';
import { getValidatedHotdogImageMediaType } from '@/shared/utils/hotdog';

import {
  STORAGE_BUCKET,
  type SupabaseStorageClient,
} from '@/server/clients/supabase/SupabaseStorage.client';
import { createHotdogImagePath } from './hotdogImagePath';

class HotdogImageUploadService {
  private _supabaseStorageClient: SupabaseStorageClient;

  constructor({ supabaseStorageClient }: { supabaseStorageClient: SupabaseStorageClient }) {
    this._supabaseStorageClient = supabaseStorageClient;
  }

  /**
   * Validates what the browser says it will upload and hands out a single-use signed URL
   * in the temp bucket. The real file is validated again before it is classified.
   */
  public createImageUploadSession = async ({
    storageFolderId,
    mediaType,
    byteSize,
  }: {
    storageFolderId: string;
    mediaType: string;
    byteSize: number;
  }): Promise<HotdogTypes.HotdogImageUploadSession> => {
    const tempImagePath = createHotdogImagePath({
      storageFolderId,
      mediaType: getValidatedHotdogImageMediaType({ mediaType, byteSize }),
    });

    const { signedUploadUrl } = await this._supabaseStorageClient.createSignedUploadUrl({
      bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
      filePath: tempImagePath,
    });
    return { uploadUrl: signedUploadUrl, tempImagePath };
  };
}

export default HotdogImageUploadService;
