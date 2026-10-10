import 'server-only';

import type { Database } from '@/shared/types';
import { ExpectedServerError, HTTP_STATUS } from '@/shared/utils/error';
import type { SupabaseClient } from '@supabase/supabase-js';

import {
  STORAGE_BUCKET,
  type SupabaseStorageClient,
} from '@/server/clients/supabase/SupabaseStorage.client';
import { createHotdogTempImagePathCandidateList } from '@/server/api/hotdog/hotdogImagePath';
import { isUuid } from '@/server/utils/uuid';
import DataDeletionAuditService, {
  DATA_DELETION_FAILURE_REASON,
  DATA_DELETION_SCOPE,
  runDataDeletionStep,
} from './DataDeletionAudit.service';

/** One answer for guest, unknown, malformed and "not yours", so other visitors' ids never leak. */
const HOTDOG_CLASSIFICATION_NOT_FOUND_ERROR_MESSAGE =
  "We couldn't find that photo. It may already be deleted.";

/** Deletes one saved classification: its images first, then its row (audited). */
class HotdogClassificationDeletionService {
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

  private _createNotFoundError = () => {
    return new ExpectedServerError(
      HOTDOG_CLASSIFICATION_NOT_FOUND_ERROR_MESSAGE,
      HTTP_STATUS.NOT_FOUND,
    );
  };

  private _findOwnedHotdogClassificationRow = async ({
    visitorSessionId,
    hotdogClassificationId,
  }: {
    visitorSessionId: string;
    hotdogClassificationId: string;
  }) => {
    const { data: hotdogClassificationRow, error } = await this._supabaseClient
      .from('hotdog_classifications')
      .select('original_image_path, thumbnail_image_path')
      .eq('id', hotdogClassificationId)
      .eq('visitor_session_id', visitorSessionId)
      .maybeSingle();

    if (error) {
      throw error;
    }
    return hotdogClassificationRow;
  };

  /**
   * The stored original and thumbnail, plus the raw upload it came from (usually already gone;
   * deleting a missing path is a no-op). Resolves to how many files were actually removed.
   */
  private _deleteHotdogClassificationImages = async ({
    originalImagePath,
    thumbnailImagePath,
  }: {
    originalImagePath: string;
    thumbnailImagePath: string | null;
  }): Promise<number> => {
    const storedImagePathList = [originalImagePath, thumbnailImagePath].filter(
      (imagePath): imagePath is string => imagePath !== null,
    );
    const [deletedStoredImageCount, deletedTempImageCount] = await Promise.all([
      this._supabaseStorageClient.deleteFileList({
        bucketId: STORAGE_BUCKET.HOTDOG_IMAGES,
        filePathList: storedImagePathList,
      }),
      this._supabaseStorageClient.deleteFileList({
        bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
        filePathList: createHotdogTempImagePathCandidateList(originalImagePath),
      }),
    ]);
    return deletedStoredImageCount + deletedTempImageCount;
  };

  /** Resolves to how many rows were actually deleted (0 if a concurrent delete won). */
  private _deleteHotdogClassificationRow = async ({
    visitorSessionId,
    hotdogClassificationId,
  }: {
    visitorSessionId: string;
    hotdogClassificationId: string;
  }): Promise<number> => {
    const { data: deletedRowList, error } = await this._supabaseClient
      .from('hotdog_classifications')
      .delete()
      .eq('id', hotdogClassificationId)
      .eq('visitor_session_id', visitorSessionId)
      .select('id');

    if (error) {
      throw error;
    }
    return deletedRowList.length;
  };

  /**
   * Storage first, DB second: if the images can't be deleted the row stays, so the visitor can
   * retry and nothing is left behind unreferenced.
   */
  public deleteHotdogClassification = async ({
    visitorSessionId,
    hotdogClassificationId,
  }: {
    /** `undefined` for a visitor without a saved session (nothing of theirs can exist). */
    visitorSessionId?: string;
    hotdogClassificationId: string;
  }): Promise<void> => {
    if (!visitorSessionId || !isUuid(hotdogClassificationId)) {
      throw this._createNotFoundError();
    }

    const hotdogClassificationRow = await this._findOwnedHotdogClassificationRow({
      visitorSessionId,
      hotdogClassificationId,
    });

    if (!hotdogClassificationRow) {
      throw this._createNotFoundError();
    }

    await this._dataDeletionAuditService.runAuditedDataDeletion({
      scope: DATA_DELETION_SCOPE.SINGLE_CLASSIFICATION,
      deleteData: async () => {
        const deletedFileCount = await runDataDeletionStep({
          failureReason: DATA_DELETION_FAILURE_REASON.STORAGE_DELETE_FAILED,
          deletionStep: () =>
            this._deleteHotdogClassificationImages({
              originalImagePath: hotdogClassificationRow.original_image_path,
              thumbnailImagePath: hotdogClassificationRow.thumbnail_image_path,
            }),
        });
        const deletedClassificationCount = await runDataDeletionStep({
          failureReason: DATA_DELETION_FAILURE_REASON.DATABASE_DELETE_FAILED,
          deletionStep: () =>
            this._deleteHotdogClassificationRow({ visitorSessionId, hotdogClassificationId }),
        });
        return { deletedClassificationCount, deletedFileCount };
      },
    });
  };
}

export default HotdogClassificationDeletionService;
