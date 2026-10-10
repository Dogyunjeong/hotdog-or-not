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

const STORAGE_LIST_PAGE_SIZE = 1000;
const STORAGE_REMOVE_BATCH_SIZE = 1000;

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
 * (sign, inspect, read, upload, delete) rather than on the SDK's call chain.
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
  }): Promise<void> => {
    const { error } = await this._bucket(bucketId).upload(filePath, fileBody, {
      contentType,
      // Re-running a retried classification writes the same bytes to the same path.
      upsert: true,
    });

    if (error) {
      throw error;
    }
  };

  /**
   * Deleting a path that doesn't exist is not an error (idempotent).
   * Sent in batches because Storage caps how many paths one `remove` accepts.
   * Resolves to how many objects were actually removed (missing paths don't count).
   */
  public deleteFileList = async ({
    bucketId,
    filePathList,
  }: {
    bucketId: StorageBucketId;
    filePathList: string[];
  }): Promise<number> => {
    if (filePathList.length === 0) {
      return 0;
    }

    const { data: removedFileObjectList, error } = await this._bucket(bucketId).remove(
      filePathList.slice(0, STORAGE_REMOVE_BATCH_SIZE),
    );

    if (error) {
      throw error;
    }

    const remainingRemovedFileCount = await this.deleteFileList({
      bucketId,
      filePathList: filePathList.slice(STORAGE_REMOVE_BATCH_SIZE),
    });
    return removedFileObjectList.length + remainingRemovedFileCount;
  };

  /** Every file path directly inside `folderPath` (pages through the listing). */
  public listFolderFilePathList = async ({
    bucketId,
    folderPath,
  }: {
    bucketId: StorageBucketId;
    folderPath: string;
  }): Promise<string[]> => {
    const listPage = async (offset: number): Promise<string[]> => {
      const { data: fileObjectList, error } = await this._bucket(bucketId).list(folderPath, {
        limit: STORAGE_LIST_PAGE_SIZE,
        offset,
      });

      if (error) {
        throw error;
      }

      // Sub-folders come back as entries with `id: null`; only files are returned.
      const filePathList = fileObjectList
        .filter((fileObject) => fileObject.id !== null)
        .map((fileObject) => `${folderPath}/${fileObject.name}`);

      if (fileObjectList.length < STORAGE_LIST_PAGE_SIZE) {
        return filePathList;
      }
      return [...filePathList, ...(await listPage(offset + STORAGE_LIST_PAGE_SIZE))];
    };

    return listPage(0);
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
