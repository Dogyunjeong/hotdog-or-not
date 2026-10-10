import 'server-only';

import type { HotdogTypes } from '@/shared/types';
import { getValidatedHotdogImageMediaType } from '@/shared/utils/hotdog';

import {
  STORAGE_BUCKET,
  type SupabaseStorageClient,
} from '@/server/clients/supabase/SupabaseStorage.client';
import { createGuestHotdogImagePath, createHotdogImagePath } from './hotdogImagePath';

class HotdogImageUploadService {
  private _supabaseStorageClient: SupabaseStorageClient;

  constructor({ supabaseStorageClient }: { supabaseStorageClient: SupabaseStorageClient }) {
    this._supabaseStorageClient = supabaseStorageClient;
  }

  private _createTempImagePath = ({
    visitorStorageFolderId,
    mediaType,
  }: {
    visitorStorageFolderId?: string;
    mediaType: HotdogTypes.HotdogImageMediaType;
  }) => {
    if (!visitorStorageFolderId) {
      return createGuestHotdogImagePath({ mediaType });
    }
    return createHotdogImagePath({ storageFolderId: visitorStorageFolderId, mediaType });
  };

  /**
   * Validates what the browser says it will upload and hands out a single-use signed URL
   * in the temp bucket. The real file is validated again before it is classified.
   * `visitorStorageFolderId` is `undefined` for guests: the upload goes to a random guest folder.
   */
  public createImageUploadSession = async ({
    visitorStorageFolderId,
    mediaType,
    byteSize,
  }: {
    visitorStorageFolderId?: string;
    mediaType: string;
    byteSize: number;
  }): Promise<HotdogTypes.HotdogImageUploadSession> => {
    const tempImagePath = this._createTempImagePath({
      visitorStorageFolderId,
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
