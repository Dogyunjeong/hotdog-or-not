import 'server-only';

import type { Database } from '@/shared/types';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { VisitorSession } from '@/server/api/visitorSession/VisitorSession.service';
import {
  STORAGE_BUCKET,
  type SupabaseStorageClient,
} from '@/server/clients/supabase/SupabaseStorage.client';
import DataDeletionAuditService, {
  DATA_DELETION_FAILURE_REASON,
  DATA_DELETION_SCOPE,
  runDataDeletionStep,
} from './DataDeletionAudit.service';

/** Both buckets keep a visitor's files under `{storageFolderId}/`: temp uploads and saved images. */
const VISITOR_STORAGE_BUCKET_ID_LIST = [
  STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
  STORAGE_BUCKET.HOTDOG_IMAGES,
] as const;

/** Erases everything saved for one visitor session (audited). */
class VisitorDataErasureService {
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

  /**
   * Lists and deletes per bucket; deleting is idempotent, so a partial run is safe to repeat.
   * Resolves to how many files were actually removed.
   */
  private _deleteVisitorStorageFolder = async (storageFolderId: string): Promise<number> => {
    const deletedFileCountList = await Promise.all(
      VISITOR_STORAGE_BUCKET_ID_LIST.map(async (bucketId) => {
        const filePathList = await this._supabaseStorageClient.listFolderFilePathList({
          bucketId,
          folderPath: storageFolderId,
        });
        return this._supabaseStorageClient.deleteFileList({ bucketId, filePathList });
      }),
    );
    return deletedFileCountList.reduce(
      (totalDeletedFileCount, deletedFileCount) => totalDeletedFileCount + deletedFileCount,
      0,
    );
  };

  /** Resolves to how many rows were actually deleted. */
  private _deleteHotdogClassificationRowList = async (visitorSessionId: string) => {
    const { data: deletedRowList, error } = await this._supabaseClient
      .from('hotdog_classifications')
      .delete()
      .eq('visitor_session_id', visitorSessionId)
      .select('id');

    if (error) {
      throw error;
    }
    return deletedRowList.length;
  };

  private _deleteVisitorSessionRow = async (visitorSessionId: string) => {
    const { error } = await this._supabaseClient
      .from('visitor_sessions')
      .delete()
      .eq('id', visitorSessionId);

    if (error) {
      throw error;
    }
  };

  /**
   * Storage first, DB second: if any file can't be deleted, every row stays, so the visitor
   * can retry and still reach (and erase) the rest.
   */
  public eraseVisitorData = async ({
    visitorSession,
  }: {
    visitorSession: VisitorSession;
  }): Promise<void> => {
    const deleteVisitorStorageFolderStep = () =>
      runDataDeletionStep({
        failureReason: DATA_DELETION_FAILURE_REASON.STORAGE_DELETE_FAILED,
        deletionStep: () => this._deleteVisitorStorageFolder(visitorSession.storageFolderId),
      });

    await this._dataDeletionAuditService.runAuditedDataDeletion({
      scope: DATA_DELETION_SCOPE.ALL_VISITOR_DATA,
      deleteData: async () => {
        const firstSweepDeletedFileCount = await deleteVisitorStorageFolderStep();
        const deletedClassificationCount = await runDataDeletionStep({
          failureReason: DATA_DELETION_FAILURE_REASON.DATABASE_DELETE_FAILED,
          // Rows first (counted), then the session; `on delete cascade` would also take them.
          deletionStep: async () => {
            const deletedHotdogClassificationCount = await this._deleteHotdogClassificationRowList(
              visitorSession.id,
            );
            await this._deleteVisitorSessionRow(visitorSession.id);
            return deletedHotdogClassificationCount;
          },
        });
        // A classification in flight during the first sweep can still store its images; with the
        // session gone it can't save a row anymore, so a second sweep leaves nothing behind.
        // If only this sweep fails, the audit row says `failed` (the session is already gone).
        const secondSweepDeletedFileCount = await deleteVisitorStorageFolderStep();
        return {
          deletedClassificationCount,
          deletedFileCount: firstSweepDeletedFileCount + secondSweepDeletedFileCount,
        };
      },
    });
  };
}

export default VisitorDataErasureService;
