import DataDeletionHandler from '@/server/api/dataDeletion/DataDeletion.handler';
import { STORAGE_BUCKET } from '@/server/clients/supabase/SupabaseStorage.client';
import { VISITOR_SESSION_COOKIE_NAME } from '@/server/utils/visitorSessionCookie';
import { HotdogClassificationController, VisitorSessionController } from '@/shared/controllers';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HISTORY_CONSENT_COOKIE, NECESSARY_ONLY_CONSENT_COOKIE } from '../../helpers/consentCookie';
import { createFakeSupabaseStorageClient } from '../../helpers/createFakeSupabaseStorageClient';
import { createFakeVisitorDataSupabaseClient } from '../../helpers/createFakeVisitorDataSupabaseClient';

const TEST_BASE_URL = 'http://localhost';
const HOTDOG_CLASSIFICATION_PATH_PATTERN = /^\/api\/hotdog-classifications\/([^/]+)$/;

const VISITOR = {
  id: '2b1e7c8a-4c2f-4f7e-9d3a-6a1b2c3d4e5f',
  storageFolderId: '7c9d1e2f-3a4b-4c5d-8e6f-a1b2c3d4e5f6',
};
const OTHER_VISITOR = {
  id: '9f8e7d6c-5b4a-4392-8170-6f5e4d3c2b1a',
  storageFolderId: '1a2b3c4d-5e6f-4a7b-8c9d-0e1f2a3b4c5d',
};

const createImagePath = ({
  storageFolderId,
  fileExtension,
}: {
  storageFolderId: string;
  fileExtension: string;
}) => `${storageFolderId}/${crypto.randomUUID()}.${fileExtension}`;

/** One visitor with saved photos (+ a pending temp upload) and another visitor who must stay untouched. */
const createDataDeletionApi = () => {
  const fakeVisitorDataSupabaseClient = createFakeVisitorDataSupabaseClient();
  const fakeSupabaseStorageClient = createFakeSupabaseStorageClient();

  const storeImage = ({
    bucketId,
    storageFolderId,
    fileExtension = 'jpg',
  }: {
    bucketId: (typeof STORAGE_BUCKET)[keyof typeof STORAGE_BUCKET];
    storageFolderId: string;
    fileExtension?: string;
  }) => {
    const filePath = createImagePath({ storageFolderId, fileExtension });
    fakeSupabaseStorageClient.putFile({
      bucketId,
      filePath,
      body: Buffer.from('image'),
      contentType: 'image/jpeg',
    });
    return filePath;
  };

  /** Original + thumbnail, both flat in the visitor's folder of `hotdog-images`. */
  const saveClassification = (visitor: typeof VISITOR) => {
    const originalImagePath = storeImage({
      bucketId: STORAGE_BUCKET.HOTDOG_IMAGES,
      storageFolderId: visitor.storageFolderId,
    });
    const thumbnailImagePath = storeImage({
      bucketId: STORAGE_BUCKET.HOTDOG_IMAGES,
      storageFolderId: visitor.storageFolderId,
      fileExtension: 'thumbnail.webp',
    });
    const hotdogClassificationId = fakeVisitorDataSupabaseClient.insertHotdogClassification({
      visitor_session_id: visitor.id,
      original_image_path: originalImagePath,
      thumbnail_image_path: thumbnailImagePath,
    });
    return { hotdogClassificationId, imagePathList: [originalImagePath, thumbnailImagePath] };
  };

  [VISITOR, OTHER_VISITOR].forEach((visitor) => {
    fakeVisitorDataSupabaseClient.insertVisitorSession({
      id: visitor.id,
      storage_folder_id: visitor.storageFolderId,
    });
  });

  const savedClassificationList = [saveClassification(VISITOR), saveClassification(VISITOR)];
  const tempImagePath = storeImage({
    bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
    storageFolderId: VISITOR.storageFolderId,
  });
  const otherVisitorClassification = saveClassification(OTHER_VISITOR);

  return {
    ...fakeVisitorDataSupabaseClient,
    ...fakeSupabaseStorageClient,
    dataDeletionHandler: new DataDeletionHandler({
      supabaseClient: fakeVisitorDataSupabaseClient.supabaseClient,
      supabaseStorageClient: fakeSupabaseStorageClient.supabaseStorageClient,
    }),
    savedClassificationList,
    tempImagePath,
    otherVisitorClassification,
  };
};

type DataDeletionApi = ReturnType<typeof createDataDeletionApi>;

/** Routes controller requests into the handler like `app/api/**​/route.ts`, with fixed browser cookies. */
const stubFetchWithDataDeletionApi = ({
  dataDeletionApi,
  cookieList,
}: {
  dataDeletionApi: DataDeletionApi;
  cookieList: string[];
}) => {
  const setCookieHeaderList: string[] = [];

  const routeApiRequest = (request: Request) => {
    const { pathname } = new URL(request.url);
    const [, hotdogClassificationId] = pathname.match(HOTDOG_CLASSIFICATION_PATH_PATTERN) ?? [];

    if (request.method === 'DELETE' && hotdogClassificationId) {
      return dataDeletionApi.dataDeletionHandler.deleteHotdogClassification(request, {
        hotdogClassificationId: decodeURIComponent(hotdogClassificationId),
      });
    }

    if (request.method === 'DELETE' && pathname === '/api/visitor-sessions/current') {
      return dataDeletionApi.dataDeletionHandler.eraseVisitorData(request);
    }
    throw new Error(`Unexpected request: ${request.method} ${pathname}`);
  };

  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    headers.set('cookie', cookieList.join('; '));

    const response = await routeApiRequest(new Request(input, { ...init, headers }));
    setCookieHeaderList.push(response.headers.get('set-cookie') ?? '');
    return response;
  });

  return { setCookieHeaderList };
};

const VISITOR_COOKIE_LIST = [
  HISTORY_CONSENT_COOKIE,
  `${VISITOR_SESSION_COOKIE_NAME}=${VISITOR.id}`,
];

const getHttpStatusCode = (error: unknown) => (error as { httpStatusCode?: number }).httpStatusCode;

describe('data deletion API', () => {
  const visitorSessionController = new VisitorSessionController({ baseUrl: TEST_BASE_URL });
  const hotdogClassificationController = new HotdogClassificationController({
    baseUrl: TEST_BASE_URL,
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('erases every file, row and the session, clears the cookie, and audits without personal data', async () => {
    const dataDeletionApi = createDataDeletionApi();
    // Revoking history drops it from the consent cookie before the erase request is sent.
    const { setCookieHeaderList } = stubFetchWithDataDeletionApi({
      dataDeletionApi,
      cookieList: [NECESSARY_ONLY_CONSENT_COOKIE, `${VISITOR_SESSION_COOKIE_NAME}=${VISITOR.id}`],
    });

    await visitorSessionController.eraseVisitorData();

    const erasedFileList = [
      ...dataDeletionApi.savedClassificationList.flatMap(({ imagePathList }) =>
        imagePathList.map((imagePath) => ({
          bucketId: STORAGE_BUCKET.HOTDOG_IMAGES,
          filePath: imagePath,
        })),
      ),
      { bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS, filePath: dataDeletionApi.tempImagePath },
    ];
    expect(erasedFileList.map(dataDeletionApi.hasFile)).toEqual([
      false,
      false,
      false,
      false,
      false,
    ]);
    expect(
      dataDeletionApi.hasFile({
        bucketId: STORAGE_BUCKET.HOTDOG_IMAGES,
        filePath: dataDeletionApi.otherVisitorClassification.imagePathList[0],
      }),
    ).toBe(true);
    expect(dataDeletionApi.getRowList('visitor_sessions').map(({ id }) => id)).toEqual([
      OTHER_VISITOR.id,
    ]);
    expect(dataDeletionApi.getRowList('hotdog_classifications').map(({ id }) => id)).toEqual([
      dataDeletionApi.otherVisitorClassification.hotdogClassificationId,
    ]);
    expect(setCookieHeaderList[0]).toMatch(
      new RegExp(`^${VISITOR_SESSION_COOKIE_NAME}=;.*Max-Age=0`),
    );

    const [dataDeletionRequestRow] = dataDeletionApi.getRowList('data_deletion_requests');
    expect(dataDeletionRequestRow).toMatchObject({
      scope: 'all_visitor_data',
      status: 'completed',
      deleted_classification_count: 2,
      deleted_file_count: 5,
      completed_at: expect.any(String),
    });
    const serializedDataDeletionRequestRow = JSON.stringify(dataDeletionRequestRow);
    [
      VISITOR.id,
      VISITOR.storageFolderId,
      ...erasedFileList.map(({ filePath }) => filePath),
    ].forEach((personalValue) =>
      expect(serializedDataDeletionRequestRow).not.toContain(personalValue),
    );
  });

  it('also erases an image a classification in flight stores after the first sweep', async () => {
    const dataDeletionApi = createDataDeletionApi();
    stubFetchWithDataDeletionApi({ dataDeletionApi, cookieList: VISITOR_COOKIE_LIST });
    const lateImagePath = `${VISITOR.storageFolderId}/${crypto.randomUUID()}.jpg`;
    const { supabaseStorageClient } = dataDeletionApi;
    const deleteFileList = supabaseStorageClient.deleteFileList;
    vi.spyOn(supabaseStorageClient, 'deleteFileList').mockImplementationOnce(async (request) => {
      const deletedFileCount = await deleteFileList(request);
      dataDeletionApi.putFile({
        bucketId: STORAGE_BUCKET.HOTDOG_IMAGES,
        filePath: lateImagePath,
        body: Buffer.from('image'),
        contentType: 'image/jpeg',
      });
      return deletedFileCount;
    });

    await visitorSessionController.eraseVisitorData();

    expect(
      dataDeletionApi.hasFile({ bucketId: STORAGE_BUCKET.HOTDOG_IMAGES, filePath: lateImagePath }),
    ).toBe(false);
    expect(dataDeletionApi.getRowList('data_deletion_requests')).toEqual([
      expect.objectContaining({ status: 'completed', deleted_file_count: 6 }),
    ]);
  });

  it('still answers success when only the final audit update fails (row left pending)', async () => {
    const dataDeletionApi = createDataDeletionApi();
    const { setCookieHeaderList } = stubFetchWithDataDeletionApi({
      dataDeletionApi,
      cookieList: VISITOR_COOKIE_LIST,
    });
    const { supabaseClient } = dataDeletionApi;
    const from = supabaseClient.from.bind(supabaseClient);
    vi.spyOn(supabaseClient, 'from').mockImplementation(((tableName: 'data_deletion_requests') => {
      const table = from(tableName);

      if (tableName !== 'data_deletion_requests') {
        return table;
      }
      return {
        ...table,
        update: () => ({ eq: async () => ({ error: new Error('Audit table is unavailable') }) }),
      };
    }) as unknown as typeof supabaseClient.from);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    await visitorSessionController.eraseVisitorData();

    expect(setCookieHeaderList[0]).toContain(`${VISITOR_SESSION_COOKIE_NAME}=`);
    expect(dataDeletionApi.getRowList('visitor_sessions')).toHaveLength(1);
    expect(dataDeletionApi.getRowList('data_deletion_requests')).toEqual([
      expect.objectContaining({ status: 'pending' }),
    ]);
  });

  it('keeps every row when storage fails (failed audit) and succeeds on retry', async () => {
    const dataDeletionApi = createDataDeletionApi();
    const { setCookieHeaderList } = stubFetchWithDataDeletionApi({
      dataDeletionApi,
      cookieList: VISITOR_COOKIE_LIST,
    });
    vi.spyOn(dataDeletionApi.supabaseStorageClient, 'deleteFileList').mockRejectedValueOnce(
      new Error('Storage is unavailable'),
    );

    const eraseError = await visitorSessionController.eraseVisitorData().catch((error) => error);

    expect(getHttpStatusCode(eraseError)).toBe(500);
    expect(setCookieHeaderList[0]).toBe('');
    expect(dataDeletionApi.getRowList('visitor_sessions')).toHaveLength(2);
    expect(dataDeletionApi.getRowList('hotdog_classifications')).toHaveLength(3);
    expect(dataDeletionApi.getRowList('data_deletion_requests')).toEqual([
      expect.objectContaining({
        status: 'failed',
        failure_reason: 'storage_delete_failed',
        completed_at: null,
      }),
    ]);

    await visitorSessionController.eraseVisitorData();

    expect(dataDeletionApi.getRowList('visitor_sessions')).toHaveLength(1);
    expect(
      dataDeletionApi.getRowList('data_deletion_requests').map(({ status }) => status),
    ).toEqual(['failed', 'completed']);
    // History is still on: a fresh session id (no row yet) replaces the erased one.
    expect(setCookieHeaderList[1]).toMatch(
      new RegExp(`^${VISITOR_SESSION_COOKIE_NAME}=[0-9a-f-]{36};.*Max-Age=31536000`),
    );
    expect(setCookieHeaderList[1]).not.toContain(VISITOR.id);
  });

  it('erases nothing for a guest without a session cookie', async () => {
    const dataDeletionApi = createDataDeletionApi();
    const { setCookieHeaderList } = stubFetchWithDataDeletionApi({
      dataDeletionApi,
      cookieList: [NECESSARY_ONLY_CONSENT_COOKIE],
    });

    await visitorSessionController.eraseVisitorData();

    expect(setCookieHeaderList).toEqual(['']);
    expect(dataDeletionApi.getRowList('visitor_sessions')).toHaveLength(2);
    expect(dataDeletionApi.getRowList('data_deletion_requests')).toEqual([]);
  });

  it('deletes one own classification: image, then row, audited', async () => {
    const dataDeletionApi = createDataDeletionApi();
    stubFetchWithDataDeletionApi({ dataDeletionApi, cookieList: VISITOR_COOKIE_LIST });
    const [deletedClassification, keptClassification] = dataDeletionApi.savedClassificationList;
    // A raw upload left over from that photo (same key, the upload's own extension).
    const leftoverTempImagePath = deletedClassification.imagePathList[0].replace(/\.jpg$/, '.png');
    dataDeletionApi.putFile({
      bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
      filePath: leftoverTempImagePath,
      body: Buffer.from('image'),
      contentType: 'image/png',
    });

    await hotdogClassificationController.deleteClassification({
      hotdogClassificationId: deletedClassification.hotdogClassificationId,
    });

    // Original, thumbnail and the leftover raw upload all go.
    expect(
      deletedClassification.imagePathList.map((imagePath) =>
        dataDeletionApi.hasFile({ bucketId: STORAGE_BUCKET.HOTDOG_IMAGES, filePath: imagePath }),
      ),
    ).toEqual([false, false]);
    expect(
      dataDeletionApi.hasFile({
        bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS,
        filePath: leftoverTempImagePath,
      }),
    ).toBe(false);
    expect(dataDeletionApi.getRowList('hotdog_classifications').map(({ id }) => id)).toEqual([
      keptClassification.hotdogClassificationId,
      dataDeletionApi.otherVisitorClassification.hotdogClassificationId,
    ]);
    expect(dataDeletionApi.getRowList('data_deletion_requests')).toEqual([
      expect.objectContaining({
        scope: 'single_classification',
        status: 'completed',
        deleted_classification_count: 1,
        deleted_file_count: 3,
        failure_reason: null,
      }),
    ]);
  });

  it("answers 404 for another visitor's, an unknown, or a malformed id, and for a guest", async () => {
    const dataDeletionApi = createDataDeletionApi();
    const otherVisitorClassificationId =
      dataDeletionApi.otherVisitorClassification.hotdogClassificationId;

    const expectDeleteNotFound = async ({
      cookieList,
      hotdogClassificationId,
    }: {
      cookieList: string[];
      hotdogClassificationId: string;
    }) => {
      stubFetchWithDataDeletionApi({ dataDeletionApi, cookieList });
      const deleteError = await hotdogClassificationController
        .deleteClassification({ hotdogClassificationId })
        .catch((error) => error);
      expect(getHttpStatusCode(deleteError)).toBe(404);
    };

    await expectDeleteNotFound({
      cookieList: VISITOR_COOKIE_LIST,
      hotdogClassificationId: otherVisitorClassificationId,
    });
    await expectDeleteNotFound({
      cookieList: VISITOR_COOKIE_LIST,
      hotdogClassificationId: crypto.randomUUID(),
    });
    await expectDeleteNotFound({
      cookieList: VISITOR_COOKIE_LIST,
      hotdogClassificationId: 'not-a-uuid',
    });
    await expectDeleteNotFound({
      cookieList: [NECESSARY_ONLY_CONSENT_COOKIE],
      hotdogClassificationId: otherVisitorClassificationId,
    });

    expect(dataDeletionApi.getRowList('hotdog_classifications')).toHaveLength(3);
    expect(dataDeletionApi.getRowList('data_deletion_requests')).toEqual([]);
  });
});
