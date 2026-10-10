import 'server-only';

import type { Database } from '@/shared/types';
import type { SupabaseClient } from '@supabase/supabase-js';

export const DATA_DELETION_SCOPE = {
  SINGLE_CLASSIFICATION: 'single_classification',
  ALL_VISITOR_DATA: 'all_visitor_data',
} as const;

type DataDeletionScope = (typeof DATA_DELETION_SCOPE)[keyof typeof DATA_DELETION_SCOPE];

const DATA_DELETION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const;

/** Generic codes only: the audit row must never hold paths, ids or error messages. */
export const DATA_DELETION_FAILURE_REASON = {
  STORAGE_DELETE_FAILED: 'storage_delete_failed',
  DATABASE_DELETE_FAILED: 'database_delete_failed',
  /** Still `pending` long after the request ended (the final update never landed). */
  ABANDONED: 'abandoned',
  UNKNOWN: 'unknown',
} as const;

type DataDeletionFailureReason =
  (typeof DATA_DELETION_FAILURE_REASON)[keyof typeof DATA_DELETION_FAILURE_REASON];

interface DeletedDataCount {
  deletedClassificationCount: number;
  deletedFileCount: number;
}

/** Tags a failed deletion step so the audit row records which step failed. */
class DataDeletionStepError extends Error {
  public readonly failureReason: DataDeletionFailureReason;

  constructor({
    failureReason,
    cause,
  }: {
    failureReason: DataDeletionFailureReason;
    cause: unknown;
  }) {
    super(`Data deletion step failed: ${failureReason}`, { cause });
    this.failureReason = failureReason;
  }
}

/** Runs one deletion step; a failure is rethrown tagged with `failureReason`. */
export const runDataDeletionStep = async <StepResult>({
  failureReason,
  deletionStep,
}: {
  failureReason: DataDeletionFailureReason;
  deletionStep: () => Promise<StepResult>;
}): Promise<StepResult> => {
  try {
    return await deletionStep();
  } catch (error) {
    throw new DataDeletionStepError({ failureReason, cause: error });
  }
};

const getDataDeletionFailureReason = (error: unknown): DataDeletionFailureReason => {
  if (error instanceof DataDeletionStepError) {
    return error.failureReason;
  }
  return DATA_DELETION_FAILURE_REASON.UNKNOWN;
};

/** Logs only the error's name: an update error could echo row values. */
const logAuditUpdateError = (auditUpdateError: unknown) => {
  const errorName = auditUpdateError instanceof Error ? auditUpdateError.name : 'UnknownError';
  console.error(`Updating a data deletion audit row failed (${errorName}).`);
};

/**
 * `data_deletion_requests` audit trail: a `pending` row is written before anything is deleted,
 * then marked `completed` (with counts) or `failed` (with a generic reason).
 */
class DataDeletionAuditService {
  private _supabaseClient: SupabaseClient<Database>;

  constructor({ supabaseClient }: { supabaseClient: SupabaseClient<Database> }) {
    this._supabaseClient = supabaseClient;
  }

  private _insertPendingDataDeletionRequest = async (scope: DataDeletionScope) => {
    const { data: dataDeletionRequestRow, error } = await this._supabaseClient
      .from('data_deletion_requests')
      .insert({ scope, status: DATA_DELETION_STATUS.PENDING })
      .select('id')
      .single();

    if (error) {
      throw error;
    }
    return dataDeletionRequestRow.id;
  };

  private _updateDataDeletionRequest = async (
    dataDeletionRequestId: string,
    dataDeletionRequestUpdate: Database['public']['Tables']['data_deletion_requests']['Update'],
  ) => {
    const { error } = await this._supabaseClient
      .from('data_deletion_requests')
      .update(dataDeletionRequestUpdate)
      .eq('id', dataDeletionRequestId);

    if (error) {
      throw error;
    }
  };

  /**
   * Best effort: the data is already gone, so the visitor must still get their success answer.
   * A row left `pending` is closed as `abandoned` by the daily data retention job.
   */
  private _markDataDeletionRequestCompleted = async (
    dataDeletionRequestId: string,
    { deletedClassificationCount, deletedFileCount }: DeletedDataCount,
  ) => {
    await this._updateDataDeletionRequest(dataDeletionRequestId, {
      status: DATA_DELETION_STATUS.COMPLETED,
      deleted_classification_count: deletedClassificationCount,
      deleted_file_count: deletedFileCount,
      completed_at: new Date().toISOString(),
    }).catch(logAuditUpdateError);
  };

  /** Best effort: the deletion error is what the caller must see, not an audit write error. */
  private _markDataDeletionRequestFailed = async (
    dataDeletionRequestId: string,
    failureReason: DataDeletionFailureReason,
  ) => {
    await this._updateDataDeletionRequest(dataDeletionRequestId, {
      status: DATA_DELETION_STATUS.FAILED,
      failure_reason: failureReason,
    }).catch(logAuditUpdateError);
  };

  /**
   * Audits `deleteData` from start to finish. Its error is rethrown after the row is marked
   * `failed`, so the request fails (retryable) and the same deletion can simply run again.
   */
  public runAuditedDataDeletion = async ({
    scope,
    deleteData,
  }: {
    scope: DataDeletionScope;
    deleteData: () => Promise<DeletedDataCount>;
  }): Promise<void> => {
    const dataDeletionRequestId = await this._insertPendingDataDeletionRequest(scope);
    const deletedDataCount = await deleteData().catch(async (deletionError: unknown) => {
      await this._markDataDeletionRequestFailed(
        dataDeletionRequestId,
        getDataDeletionFailureReason(deletionError),
      );
      throw deletionError;
    });
    await this._markDataDeletionRequestCompleted(dataDeletionRequestId, deletedDataCount);
  };

  /** Marks rows still `pending` after `pendingForMs` as `failed` / `abandoned`; returns how many. */
  public markAbandonedDataDeletionRequestsFailed = async ({
    pendingForMs,
  }: {
    pendingForMs: number;
  }): Promise<number> => {
    const { data: abandonedRowList, error } = await this._supabaseClient
      .from('data_deletion_requests')
      .update({
        status: DATA_DELETION_STATUS.FAILED,
        failure_reason: DATA_DELETION_FAILURE_REASON.ABANDONED,
      })
      .eq('status', DATA_DELETION_STATUS.PENDING)
      .lt('requested_at', new Date(Date.now() - pendingForMs).toISOString())
      .select('id');

    if (error) {
      throw error;
    }
    return abandonedRowList.length;
  };
}

export default DataDeletionAuditService;
