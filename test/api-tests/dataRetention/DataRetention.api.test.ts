import DataRetentionHandler from '@/server/api/dataRetention/DataRetention.handler';
import { STORAGE_BUCKET } from '@/server/clients/supabase/SupabaseStorage.client';
import { describe, expect, it } from 'vitest';

import { createFakeSupabaseStorageClient } from '../../helpers/createFakeSupabaseStorageClient';
import { createFakeVisitorDataSupabaseClient } from '../../helpers/createFakeVisitorDataSupabaseClient';

const TEST_CRON_SECRET = 'test-cron-secret';
const HOUR_MS = 60 * 60 * 1000;

const createUploadPath = () => `${crypto.randomUUID()}/${crypto.randomUUID()}.jpg`;

/**
 * Two temp uploads (one older than a day) and three audit rows. The SQL age filter of
 * `list_stale_hotdog_image_uploads` is stood in for by the stub: it returns the stale key.
 */
const createDataRetentionApi = () => {
  const fakeVisitorDataSupabaseClient = createFakeVisitorDataSupabaseClient();
  const fakeSupabaseStorageClient = createFakeSupabaseStorageClient();
  const staleUploadPath = createUploadPath();
  const freshUploadPath = createUploadPath();

  [staleUploadPath, freshUploadPath].forEach((filePath) => {
    fakeSupabaseStorageClient.putFile({
      bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
      filePath,
      body: Buffer.from('image'),
      contentType: 'image/jpeg',
    });
  });
  fakeVisitorDataSupabaseClient.stubRpc('list_stale_hotdog_image_uploads', () =>
    [staleUploadPath]
      .filter((filePath) =>
        fakeSupabaseStorageClient.hasFile({
          bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
          filePath,
        }),
      )
      .map((filePath) => ({ name: filePath })),
  );

  const insertAuditRow = ({ status, ageMs }: { status: string; ageMs: number }) =>
    fakeVisitorDataSupabaseClient.insertDataDeletionRequest({
      scope: 'all_visitor_data',
      status,
      requested_at: new Date(Date.now() - ageMs).toISOString(),
    });

  return {
    ...fakeVisitorDataSupabaseClient,
    ...fakeSupabaseStorageClient,
    dataRetentionHandler: new DataRetentionHandler({
      supabaseClient: fakeVisitorDataSupabaseClient.supabaseClient,
      supabaseStorageClient: fakeSupabaseStorageClient.supabaseStorageClient,
      cronSecret: TEST_CRON_SECRET,
    }),
    staleUploadPath,
    freshUploadPath,
    stalePendingAuditId: insertAuditRow({ status: 'pending', ageMs: 2 * HOUR_MS }),
    freshPendingAuditId: insertAuditRow({ status: 'pending', ageMs: 0 }),
    oldCompletedAuditId: insertAuditRow({ status: 'completed', ageMs: 48 * HOUR_MS }),
  };
};

const createCronRequest = (authorization?: string) => {
  const headers: Record<string, string> = authorization ? { authorization } : {};
  return new Request('http://localhost/api/cron/data-retention', { headers });
};

describe('data retention cron API', () => {
  it('deletes stale temp uploads and closes abandoned deletion requests', async () => {
    const dataRetentionApi = createDataRetentionApi();

    const response = await dataRetentionApi.dataRetentionHandler.runDataRetention(
      createCronRequest(`Bearer ${TEST_CRON_SECRET}`),
    );

    await expect(response.json()).resolves.toEqual({
      deletedStaleHotdogImageUploadCount: 1,
      abandonedDataDeletionRequestCount: 1,
    });
    const hasUpload = (filePath: string) =>
      dataRetentionApi.hasFile({ bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS, filePath });
    expect(hasUpload(dataRetentionApi.staleUploadPath)).toBe(false);
    expect(hasUpload(dataRetentionApi.freshUploadPath)).toBe(true);

    const auditStatusById = new Map(
      dataRetentionApi
        .getRowList('data_deletion_requests')
        .map(({ id, status, failure_reason }) => [id, { status, failure_reason }]),
    );
    expect(auditStatusById.get(dataRetentionApi.stalePendingAuditId)).toEqual({
      status: 'failed',
      failure_reason: 'abandoned',
    });
    expect(auditStatusById.get(dataRetentionApi.freshPendingAuditId)?.status).toBe('pending');
    expect(auditStatusById.get(dataRetentionApi.oldCompletedAuditId)?.status).toBe('completed');
  });

  it('answers 401 without the cron secret and deletes nothing', async () => {
    const dataRetentionApi = createDataRetentionApi();

    const statusCodeList = await Promise.all(
      [undefined, 'Bearer wrong-secret', TEST_CRON_SECRET].map(async (authorization) => {
        const response = await dataRetentionApi.dataRetentionHandler.runDataRetention(
          createCronRequest(authorization),
        );
        return response.status;
      }),
    );

    expect(statusCodeList).toEqual([401, 401, 401]);
    expect(
      dataRetentionApi.hasFile({
        bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
        filePath: dataRetentionApi.staleUploadPath,
      }),
    ).toBe(true);
  });
});
