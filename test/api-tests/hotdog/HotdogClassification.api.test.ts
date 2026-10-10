import HotdogClassificationHandler from '@/server/api/hotdog/HotdogClassification.handler';
import HotdogImageUploadHandler from '@/server/api/hotdog/HotdogImageUpload.handler';
import type VisitorSessionService from '@/server/api/visitorSession/VisitorSession.service';
import { STORAGE_BUCKET } from '@/server/clients/supabase/SupabaseStorage.client';
import { VISITOR_SESSION_COOKIE_NAME } from '@/server/utils/visitorSessionCookie';
import { HotdogClassificationController } from '@/shared/controllers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { HISTORY_CONSENT_COOKIE, NECESSARY_ONLY_CONSENT_COOKIE } from '../../helpers/consentCookie';
import { createFakeHotdogClassificationSupabaseClient } from '../../helpers/createFakeHotdogClassificationSupabaseClient';
import { createFakeOpenAIClient } from '../../helpers/createFakeOpenAIClient';
import { createFakeReverseGeocodingClient } from '../../helpers/createFakeReverseGeocodingClient';
import { createFakeSupabaseStorageClient } from '../../helpers/createFakeSupabaseStorageClient';
import { createTestHotdogImageBuffer } from '../../helpers/createTestHotdogImageBuffer';
import { HOTDOG_MODEL_OUTPUT } from '../../helpers/hotdogClassificationModelOutput';

const TEST_BASE_URL = 'http://localhost';
const SIGNED_UPLOAD_URL_PATTERN = /^https:\/\/storage\.test\/upload\/sign\/([^/]+)\/(.+)\?token=/;
const STUB_STORAGE_FOLDER_ID = '7c9d1e2f-3a4b-4c5d-8e6f-a1b2c3d4e5f6';

/** Keeps the cookie the way a browser would: a new session id per visitor. */
const createStubVisitorSessionService = () => {
  const resolveVisitorSession = vi.fn(
    async ({ visitorSessionId }: { visitorSessionId?: string }) => ({
      id: visitorSessionId ?? crypto.randomUUID(),
      storageFolderId: STUB_STORAGE_FOLDER_ID,
      isOnboardingCompleted: true,
    }),
  );
  return {
    visitorSessionService: { resolveVisitorSession } as unknown as VisitorSessionService,
    resolveVisitorSession,
  };
};

const createHotdogApi = () => {
  const { openAIClient } = createFakeOpenAIClient({ outputParsed: HOTDOG_MODEL_OUTPUT });
  const { supabaseClient, hotdogClassificationRowList } =
    createFakeHotdogClassificationSupabaseClient();
  const { supabaseStorageClient, putFile, hasFile } = createFakeSupabaseStorageClient();
  const { reverseGeocodingClient } = createFakeReverseGeocodingClient();
  const { visitorSessionService, resolveVisitorSession } = createStubVisitorSessionService();
  return {
    hotdogImageUploadHandler: new HotdogImageUploadHandler({
      supabaseStorageClient,
      visitorSessionService,
    }),
    hotdogClassificationHandler: new HotdogClassificationHandler({
      openAIClient,
      supabaseClient,
      supabaseStorageClient,
      reverseGeocodingClient,
      visitorSessionService,
    }),
    hotdogClassificationRowList,
    resolveVisitorSession,
    putFile,
    hasFile,
  };
};

type HotdogApi = ReturnType<typeof createHotdogApi>;

/**
 * Routes controller requests into the handlers the same way `app/api/**​/route.ts` does,
 * PUTs to signed upload URLs into the fake storage, and carries the browser's cookies:
 * the consent cookie (when given) and the visitor session cookie once it is set.
 */
const stubFetchWithHotdogApi = (
  hotdogApi: HotdogApi,
  { consentCookieHeader }: { consentCookieHeader?: string } = {},
) => {
  const visitorCookieJar: { cookieHeader?: string } = {};

  const routeApiRequest = (request: Request) => {
    const routeKey = `${request.method} ${new URL(request.url).pathname}`;

    switch (routeKey) {
      case 'POST /api/hotdog-image-uploads':
        return hotdogApi.hotdogImageUploadHandler.createImageUploadSession(request);
      case 'POST /api/hotdog-classifications':
        return hotdogApi.hotdogClassificationHandler.classifyUploadedImage(request);
      case 'GET /api/hotdog-classifications':
        return hotdogApi.hotdogClassificationHandler.listHotdogClassifications(request);
      default:
        throw new Error(`Unexpected request: ${routeKey}`);
    }
  };

  const putIntoSignedUploadUrl = async (request: Request) => {
    const [, bucketId, filePath] = request.url.match(SIGNED_UPLOAD_URL_PATTERN) ?? [];
    hotdogApi.putFile({
      bucketId,
      filePath: decodeURIComponent(filePath),
      body: Buffer.from(await request.arrayBuffer()),
      contentType: request.headers.get('content-type') ?? '',
    });
    return new Response(null, { status: 200 });
  };

  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);

    if (SIGNED_UPLOAD_URL_PATTERN.test(request.url)) {
      return putIntoSignedUploadUrl(request);
    }

    const cookieHeader = [consentCookieHeader, visitorCookieJar.cookieHeader]
      .filter(Boolean)
      .join('; ');

    if (cookieHeader) {
      request.headers.set('cookie', cookieHeader);
    }
    const response = await routeApiRequest(request);
    const setCookieHeader = response.headers.get('set-cookie');

    if (setCookieHeader) {
      visitorCookieJar.cookieHeader = setCookieHeader.split(';')[0];
    }
    return response;
  });

  return { getVisitorCookieHeader: () => visitorCookieJar.cookieHeader };
};

const createImageFile = async () => {
  const imageBuffer = await createTestHotdogImageBuffer();
  return new Blob([new Uint8Array(imageBuffer)], { type: 'image/jpeg' });
};

describe('hotdog classification API', () => {
  let hotdogClassificationController: HotdogClassificationController;

  const uploadImage = async (imageFile: Blob) => {
    const hotdogImageUploadSession = await hotdogClassificationController.createImageUploadSession({
      mediaType: 'image/jpeg',
      byteSize: imageFile.size,
    });
    await hotdogClassificationController.uploadImage({ hotdogImageUploadSession, imageFile });
    return hotdogImageUploadSession;
  };

  beforeEach(() => {
    hotdogClassificationController = new HotdogClassificationController({
      baseUrl: TEST_BASE_URL,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('uploads, classifies, and lists an image for a visitor with history', async () => {
    const hotdogApi = createHotdogApi();
    const { getVisitorCookieHeader } = stubFetchWithHotdogApi(hotdogApi, {
      consentCookieHeader: HISTORY_CONSENT_COOKIE,
    });

    const { tempImagePath } = await uploadImage(await createImageFile());
    expect(getVisitorCookieHeader()).toMatch(new RegExp(`^${VISITOR_SESSION_COOKIE_NAME}=`));
    // The path is scoped by the non-secret folder id, never by the session id.
    expect(tempImagePath.startsWith(`${STUB_STORAGE_FOLDER_ID}/`)).toBe(true);

    const hotdogClassificationRecord = await hotdogClassificationController.classifyUploadedImage({
      tempImagePath,
    });
    expect(hotdogClassificationRecord).toMatchObject({
      id: expect.any(String),
      isHotdog: true,
      reason: HOTDOG_MODEL_OUTPUT.reason,
      originalImageUrl: expect.stringContaining(tempImagePath.replace(/\.jpg$/, '.webp')),
      thumbnailImageUrl: expect.stringContaining('.thumbnail.webp'),
      details: { kind: 'hotdog', origin: { source: 'styleGuess' } },
    });
    expect(
      hotdogApi.hasFile({
        bucketId: STORAGE_BUCKET.HOTDOG_IMAGES,
        filePath: tempImagePath.replace(/\.jpg$/, '.webp'),
      }),
    ).toBe(true);
    expect(
      hotdogApi.hasFile({ bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS, filePath: tempImagePath }),
    ).toBe(false);

    await expect(hotdogClassificationController.listClassifications()).resolves.toEqual({
      isHistoryEnabled: true,
      hotdogClassificationList: [hotdogClassificationRecord],
    });
  });

  it('classifies for a guest without a session, saving nothing', async () => {
    const hotdogApi = createHotdogApi();
    const { getVisitorCookieHeader } = stubFetchWithHotdogApi(hotdogApi, {
      consentCookieHeader: NECESSARY_ONLY_CONSENT_COOKIE,
    });

    const { tempImagePath } = await uploadImage(await createImageFile());
    expect(tempImagePath.startsWith('guest/')).toBe(true);

    await expect(
      hotdogClassificationController.classifyUploadedImage({ tempImagePath }),
    ).resolves.toMatchObject({
      id: null,
      isHotdog: true,
      originalImageUrl: '',
      thumbnailImageUrl: '',
      details: { kind: 'hotdog' },
    });
    expect(
      hotdogApi.hasFile({ bucketId: STORAGE_BUCKET.HOTDOG_IMAGE_UPLOADS, filePath: tempImagePath }),
    ).toBe(false);
    expect(
      hotdogApi.hasFile({ bucketId: STORAGE_BUCKET.HOTDOG_IMAGES, filePath: tempImagePath }),
    ).toBe(false);
    expect(hotdogApi.hotdogClassificationRowList).toEqual([]);

    await expect(hotdogClassificationController.listClassifications()).resolves.toEqual({
      isHistoryEnabled: false,
      hotdogClassificationList: [],
    });
    expect(getVisitorCookieHeader()).toBeUndefined();
    expect(hotdogApi.resolveVisitorSession).not.toHaveBeenCalled();
  });
});
