import type { Database } from '@seamflow/shared-types';
import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseClient } from './getSupabaseClient.ts';

/** Bucket ids. Buckets are created by migrations in `supabase/migrations`. */
export const STORAGE_BUCKET = {
  HOTDOG_IMAGES: 'hotdog-images',
} as const;

type StorageBucketId = (typeof STORAGE_BUCKET)[keyof typeof STORAGE_BUCKET];

/**
 * Thin wrapper over Supabase Storage so services depend on what they do
 * (upload a file) rather than on the SDK's call chain.
 */
export class SupabaseStorageClient {
  private _supabaseClient: SupabaseClient<Database>;

  constructor({ supabaseClient }: { supabaseClient: SupabaseClient<Database> }) {
    this._supabaseClient = supabaseClient;
  }

  public uploadFile = async ({
    bucketId,
    filePath,
    fileBody,
    contentType,
  }: {
    bucketId: StorageBucketId;
    filePath: string;
    fileBody: Buffer;
    contentType: string;
  }): Promise<{ filePath: string }> => {
    const { error } = await this._supabaseClient.storage
      .from(bucketId)
      .upload(filePath, fileBody, { contentType, upsert: false });

    if (error) {
      throw error;
    }
    return { filePath };
  };
}

let supabaseStorageClient: SupabaseStorageClient | undefined;

export const getSupabaseStorageClient = (): SupabaseStorageClient => {
  if (supabaseStorageClient) {
    return supabaseStorageClient;
  }

  supabaseStorageClient = new SupabaseStorageClient({ supabaseClient: getSupabaseClient() });
  return supabaseStorageClient;
};
