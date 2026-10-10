import 'server-only';

import type { Database, SharedTypes } from '@/shared/types';
import type { SupabaseClient } from '@supabase/supabase-js';
import { timingSafeEqual } from 'node:crypto';

import { getSupabaseClient } from '@/server/clients/supabase/getSupabaseClient';
import {
  getSupabaseStorageClient,
  type SupabaseStorageClient,
} from '@/server/clients/supabase/SupabaseStorage.client';
import { getEnvironmentVariable } from '@/server/configs/app.config';
import { handleError } from '@/server/utils/handleError';
import DataRetentionService from './DataRetention.service';

/** A missing secret must not crash the route: it just means nobody is authorized. */
const readCronSecret = (): string | undefined => {
  try {
    return getEnvironmentVariable('CRON_SECRET');
  } catch {
    return undefined;
  }
};

const isSameSecret = (receivedValue: string, expectedValue: string) => {
  const receivedBuffer = Buffer.from(receivedValue);
  const expectedBuffer = Buffer.from(expectedValue);
  return (
    receivedBuffer.length === expectedBuffer.length &&
    timingSafeEqual(receivedBuffer, expectedBuffer)
  );
};

class DataRetentionHandler {
  private _supabaseClient?: SupabaseClient<Database>;
  private _supabaseStorageClient?: SupabaseStorageClient;
  private _cronSecret?: string;

  /** Dependencies are injectable for tests; production resolves them lazily from env. */
  constructor({
    supabaseClient,
    supabaseStorageClient,
    cronSecret,
  }: {
    supabaseClient?: SupabaseClient<Database>;
    supabaseStorageClient?: SupabaseStorageClient;
    cronSecret?: string;
  } = {}) {
    this._supabaseClient = supabaseClient;
    this._supabaseStorageClient = supabaseStorageClient;
    this._cronSecret = cronSecret;
  }

  private _getDependencies = () => {
    return {
      dataRetentionService: new DataRetentionService({
        supabaseClient: this._supabaseClient || getSupabaseClient(),
        supabaseStorageClient: this._supabaseStorageClient || getSupabaseStorageClient(),
      }),
    };
  };

  /** Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`. Fails closed without a secret. */
  private _isAuthorizedCronRequest = (request: Request) => {
    const cronSecret = this._cronSecret ?? readCronSecret();

    if (!cronSecret) {
      return false;
    }
    return isSameSecret(request.headers.get('authorization') ?? '', `Bearer ${cronSecret}`);
  };

  /** Daily (`vercel.json` crons): deletes stale temp uploads and closes abandoned audit rows. */
  public runDataRetention = async (request: Request): Promise<Response> => {
    if (!this._isAuthorizedCronRequest(request)) {
      const unauthorizedResponse: SharedTypes.ApiErrorResponse = { message: 'Unauthorized' };
      return Response.json(unauthorizedResponse, { status: 401 });
    }

    try {
      const { dataRetentionService } = this._getDependencies();
      const dataRetentionResult = await dataRetentionService.runDataRetention();
      // Counts only: no paths or ids in logs.
      console.info(
        `Data retention: ${dataRetentionResult.deletedStaleHotdogImageUploadCount} stale uploads deleted, ${dataRetentionResult.abandonedDataDeletionRequestCount} abandoned deletion requests closed.`,
      );
      return Response.json(dataRetentionResult);
    } catch (error) {
      return handleError({ error, defaultMessage: 'Data retention failed.' });
    }
  };
}

export default DataRetentionHandler;
