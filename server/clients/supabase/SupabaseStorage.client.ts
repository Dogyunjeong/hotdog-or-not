import 'server-only';

import type { Database } from '@/shared/types';
import { StorageApiError, type SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseClient } from './getSupabaseClient';

/** Bucket ids. Buckets are created by migrations in `supabase/migrations`. */
export const STORAGE_BUCKET = {
  /** Temp bucket the browser uploads into via signed upload URLs. */
  HOTDOG_IMAGE_UPLOADS: 'hotdog-image-uploads',
  /** Destination bucket for classified images. */
  HOTDOG_IMAGES: 'hotdog-images',
} as const;

/** Supabase answers a missing object with `statusCode: '404'` (HTTP 400, code `NoSuchKey`). */
const isStorageObjectNotFoundError = (error: unknown) => {
  return error instanceof StorageApiError && error.statusCode === '404';
};

type StorageBucketId = (typeof STORAGE_BUCKET)[keyof typeof STORAGE_BUCKET];

interface StorageFileInfo {
  byteSize: number;
  contentType: string;
}

/**
 * Thin wrapper over Supabase Storage so services depend on what they do
 * (sign, inspect, read, move) rather than on the SDK's call chain.
 * Errors from the SDK are rethrown as-is (unexpected → 500, retryable), except a missing
 * object on `getFileInfo`, which resolves to `undefined` so services decide the user-facing error.
 */
export class SupabaseStorageClient {
  private _supabaseClient: SupabaseClient<Database>;

  constructor({ supabaseClient }: { supabaseClient: SupabaseClient<Database> }) {
    this._supabaseClient = supabaseClient;
  }

  private _bucket = (bucketId: StorageBucketId) => this._supabaseClient.storage.from(bucketId);

  /** Signed URLs are single-use and valid for 2 hours (Supabase default). */
  public createSignedUploadUrl = async ({
    bucketId,
    filePath,
  }: {
    bucketId: StorageBucketId;
    filePath: string;
  }): Promise<{ signedUploadUrl: string }> => {
    const { data, error } = await this._bucket(bucketId).createSignedUploadUrl(filePath);

    if (error) {
      throw error;
    }
    return { signedUploadUrl: data.signedUrl };
  };

  public getFileInfo = async ({
    bucketId,
    filePath,
  }: {
    bucketId: StorageBucketId;
    filePath: string;
  }): Promise<StorageFileInfo | undefined> => {
    const { data, error } = await this._bucket(bucketId).info(filePath);

    if (isStorageObjectNotFoundError(error)) {
      return undefined;
    }

    if (error) {
      throw error;
    }
    return { byteSize: data.size ?? 0, contentType: data.contentType ?? '' };
  };

  public downloadFile = async ({
    bucketId,
    filePath,
  }: {
    bucketId: StorageBucketId;
    filePath: string;
  }): Promise<Buffer> => {
    const { data, error } = await this._bucket(bucketId).download(filePath);

    if (error) {
      throw error;
    }
    return Buffer.from(await data.arrayBuffer());
  };

  public moveFile = async ({
    sourceBucketId,
    sourceFilePath,
    destinationBucketId,
    destinationFilePath,
  }: {
    sourceBucketId: StorageBucketId;
    sourceFilePath: string;
    destinationBucketId: StorageBucketId;
    destinationFilePath: string;
  }): Promise<void> => {
    const { error } = await this._bucket(sourceBucketId).move(sourceFilePath, destinationFilePath, {
      destinationBucket: destinationBucketId,
    });

    if (error) {
      throw error;
    }
  };

  /**
   * One request for many files. Returns a path → signed URL map; missing objects are left out
   * so callers can show a fallback instead of a broken image.
   */
  public createSignedReadUrlList = async ({
    bucketId,
    filePathList,
    expiresInSeconds,
  }: {
    bucketId: StorageBucketId;
    filePathList: string[];
    expiresInSeconds: number;
  }): Promise<Map<string, string>> => {
    if (filePathList.length === 0) {
      return new Map();
    }

    const { data, error } = await this._bucket(bucketId).createSignedUrls(
      filePathList,
      expiresInSeconds,
    );

    if (error) {
      throw error;
    }
    const signedUrlEntryList = data.flatMap(({ path, signedUrl }): [string, string][] => {
      if (!path || !signedUrl) {
        return [];
      }
      return [[path, signedUrl]];
    });
    return new Map(signedUrlEntryList);
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
