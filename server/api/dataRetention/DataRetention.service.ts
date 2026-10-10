import 'server-only';

import type { Database } from '@/shared/types';
import type { SupabaseClient } from '@supabase/supabase-js';

import DataDeletionAuditService from '@/server/api/dataDeletion/DataDeletionAudit.service';
import {
  STORAGE_BUCKET,
  type SupabaseStorageClient,
} from '@/server/clients/supabase/SupabaseStorage.client';

/** Raw uploads may carry GPS; one a day old won't be classified anymore. */
const STALE_HOTDOG_IMAGE_UPLOAD_AGE = '24 hours';
/** Storage accepts up to 1000 paths per delete. */
const STALE_HOTDOG_IMAGE_UPLOAD_BATCH_SIZE = 1000;
/** Bounds one run; anything left is picked up by the next day's run. */
const MAX_STALE_HOTDOG_IMAGE_UPLOAD_BATCH_COUNT = 20;
/** A deletion request ends within seconds; `pending` after an hour means it never finished. */
const ABANDONED_DATA_DELETION_REQUEST_PENDING_MS = 60 * 60 * 1000;

export interface DataRetentionResult {
  deletedStaleHotdogImageUploadCount: number;
  abandonedDataDeletionRequestCount: number;
}

/** The daily cleanup: stale temp uploads, and audit rows stuck in `pending`. */
class DataRetentionService {
  private _supabaseClient: SupabaseClient<Database>;
  private _supabaseStorageClient: SupabaseStorageClient;
  private _dataDeletionAuditService: DataDeletionAuditService;

  constructor({
    supabaseClient,
    supabaseStorageClient,
  }: {
    supabaseClient: SupabaseClient<Database>;
    supabaseStorageClient: SupabaseStorageClient;
  }) {
    this._supabaseClient = supabaseClient;
    this._supabaseStorageClient = supabaseStorageClient;
    this._dataDeletionAuditService = new DataDeletionAuditService({ supabaseClient });
  }

  private _listStaleHotdogImageUploadPathList = async (): Promise<string[]> => {
    const { data: staleHotdogImageUploadList, error } = await this._supabaseClient.rpc(
      'list_stale_hotdog_image_uploads',
      {
        older_than: STALE_HOTDOG_IMAGE_UPLOAD_AGE,
        max_rows: STALE_HOTDOG_IMAGE_UPLOAD_BATCH_SIZE,
      },
    );

    if (error) {
      throw error;
    }
    return staleHotdogImageUploadList.map(({ name }) => name);
  };

  /** Batch by batch: each listing starts over, since the previous batch is gone by then. */
  private _deleteStaleHotdogImageUploads = async (batchIndex = 0): Promise<number> => {
    const staleHotdogImageUploadPathList = await this._listStaleHotdogImageUploadPathList();
    const deletedFileCount = await this._supabaseStorageClient.deleteFileList({
      bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
      filePathList: staleHotdogImageUploadPathList,
    });
    const isLastBatch =
      staleHotdogImageUploadPathList.length < STALE_HOTDOG_IMAGE_UPLOAD_BATCH_SIZE ||
      // Nothing removed: listing the same keys again would loop forever.
      deletedFileCount === 0 ||
      batchIndex + 1 >= MAX_STALE_HOTDOG_IMAGE_UPLOAD_BATCH_COUNT;

    if (isLastBatch) {
      return deletedFileCount;
    }
    return deletedFileCount + (await this._deleteStaleHotdogImageUploads(batchIndex + 1));
  };

  public runDataRetention = async (): Promise<DataRetentionResult> => {
    const [deletedStaleHotdogImageUploadCount, abandonedDataDeletionRequestCount] =
      await Promise.all([
        this._deleteStaleHotdogImageUploads(),
        this._dataDeletionAuditService.markAbandonedDataDeletionRequestsFailed({
          pendingForMs: ABANDONED_DATA_DELETION_REQUEST_PENDING_MS,
        }),
      ]);
    return { deletedStaleHotdogImageUploadCount, abandonedDataDeletionRequestCount };
  };
}

export default DataRetentionService;
