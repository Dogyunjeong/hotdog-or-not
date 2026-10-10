import 'server-only';

import {
  STORAGE_BUCKET,
  type SupabaseStorageClient,
} from '@/server/clients/supabase/SupabaseStorage.client';

/** Signed read URLs live 1 hour; the DB only stores storage keys. */
const HOTDOG_IMAGE_READ_URL_EXPIRES_IN_SECONDS = 60 * 60;

/**
 * Signs every `hotdog-images` storage key in ONE storage request.
 * Returns key → signed URL; missing objects are left out (callers fall back to '').
 */
export const createHotdogImageUrlMap = ({
  supabaseStorageClient,
  storageKeyList,
}: {
  supabaseStorageClient: SupabaseStorageClient;
  storageKeyList: string[];
}): Promise<Map<string, string>> => {
  return supabaseStorageClient.createSignedReadUrlList({
    bucketId: STORAGE_BUCKET.HOTDOG_IMAGES,
    filePathList: [...new Set(storageKeyList)],
    expiresInSeconds: HOTDOG_IMAGE_READ_URL_EXPIRES_IN_SECONDS,
  });
};
