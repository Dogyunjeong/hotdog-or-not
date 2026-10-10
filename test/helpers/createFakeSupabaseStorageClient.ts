import { SupabaseStorageClient } from '@/server/clients/supabase/SupabaseStorage.client';
import type { Database } from '@/shared/types';
import { StorageApiError, type SupabaseClient } from '@supabase/supabase-js';

interface FakeStoredFile {
  body: Buffer;
  contentType: string;
}

// Same shape as real Supabase Storage for a missing object.
const NOT_FOUND_ERROR = new StorageApiError('Object not found', 400, '404');

/**
 * Real `SupabaseStorageClient` over an in-memory fake of the Supabase Storage SDK.
 * `putFile` simulates the browser's PUT to a signed upload URL.
 */
export const createFakeSupabaseStorageClient = () => {
  const bucketFileMap = new Map<string, Map<string, FakeStoredFile>>();

  const getBucketFiles = (bucketId: string) => {
    const existingBucketFiles = bucketFileMap.get(bucketId);

    if (existingBucketFiles) {
      return existingBucketFiles;
    }

    const createdBucketFiles = new Map<string, FakeStoredFile>();
    bucketFileMap.set(bucketId, createdBucketFiles);
    return createdBucketFiles;
  };

  const from = (bucketId: string) => ({
    createSignedUploadUrl: async (filePath: string) => ({
      data: {
        signedUrl: `https://storage.test/upload/sign/${bucketId}/${filePath}?token=test`,
        path: filePath,
        token: 'test',
      },
      error: null,
    }),
    info: async (filePath: string) => {
      const storedFile = getBucketFiles(bucketId).get(filePath);

      if (!storedFile) {
        return { data: null, error: NOT_FOUND_ERROR };
      }
      return {
        data: { size: storedFile.body.byteLength, contentType: storedFile.contentType },
        error: null,
      };
    },
    download: async (filePath: string) => {
      const storedFile = getBucketFiles(bucketId).get(filePath);

      if (!storedFile) {
        return { data: null, error: NOT_FOUND_ERROR };
      }
      return {
        data: new Blob([new Uint8Array(storedFile.body)], { type: storedFile.contentType }),
        error: null,
      };
    },
    move: async (
      sourceFilePath: string,
      destinationFilePath: string,
      { destinationBucket }: { destinationBucket: string },
    ) => {
      const storedFile = getBucketFiles(bucketId).get(sourceFilePath);

      if (!storedFile) {
        return { data: null, error: NOT_FOUND_ERROR };
      }
      getBucketFiles(bucketId).delete(sourceFilePath);
      getBucketFiles(destinationBucket).set(destinationFilePath, storedFile);
      return { data: { message: 'Successfully moved' }, error: null };
    },
    createSignedUrls: async (filePathList: string[], expiresInSeconds: number) => ({
      data: filePathList.map((filePath) => {
        const isStored = getBucketFiles(bucketId).has(filePath);
        return {
          path: filePath,
          signedUrl: isStored
            ? `https://storage.test/object/sign/${bucketId}/${filePath}?expiresIn=${expiresInSeconds}`
            : null,
          error: isStored
            ? null
            : 'Either the object does not exist or you do not have access to it',
        };
      }),
      error: null,
    }),
  });

  const supabaseClient = { storage: { from } } as unknown as SupabaseClient<Database>;

  return {
    supabaseStorageClient: new SupabaseStorageClient({ supabaseClient }),
    putFile: ({
      bucketId,
      filePath,
      body,
      contentType,
    }: {
      bucketId: string;
      filePath: string;
      body: Buffer;
      contentType: string;
    }) => {
      getBucketFiles(bucketId).set(filePath, { body, contentType });
    },
    hasFile: ({ bucketId, filePath }: { bucketId: string; filePath: string }) =>
      getBucketFiles(bucketId).has(filePath),
  };
};
