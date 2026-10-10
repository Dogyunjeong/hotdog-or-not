import HotdogClassificationHandler from '@/server/api/hotdog/HotdogClassification.handler';
import HotdogImageUploadHandler from '@/server/api/hotdog/HotdogImageUpload.handler';
import type VisitorSessionService from '@/server/api/visitorSession/VisitorSession.service';
import { STORAGE_BUCKET } from '@/server/clients/supabase/SupabaseStorage.client';
import { VISITOR_SESSION_COOKIE_NAME } from '@/server/utils/visitorSessionCookie';
import { HotdogClassificationController } from '@/shared/controllers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeHotdogClassificationSupabaseClient } from '../../helpers/createFakeHotdogClassificationSupabaseClient';
import { createFakeOpenAIClient } from '../../helpers/createFakeOpenAIClient';
import { createFakeSupabaseStorageClient } from '../../helpers/createFakeSupabaseStorageClient';

const TEST_BASE_URL = 'http://localhost';
const SIGNED_UPLOAD_URL_PATTERN = /^https:\/\/storage\.test\/upload\/sign\/([^/]+)\/(.+)\?token=/;
const STUB_STORAGE_FOLDER_ID = '7c9d1e2f-3a4b-4c5d-8e6f-a1b2c3d4e5f6';
const hotdogClassification = { isHotdog: true, reason: 'Classic ballpark dog.' };

/** Keeps the cookie the way a browser would: a new session id per visitor. */
const createStubVisitorSessionService = () => {
  return {
    resolveVisitorSession: async ({ visitorSessionId }: { visitorSessionId?: string }) => ({
      id: visitorSessionId ?? crypto.randomUUID(),
      storageFolderId: STUB_STORAGE_FOLDER_ID,
      isOnboardingCompleted: true,
    }),
  } as unknown as VisitorSessionService;
};

const createHotdogApi = () => {
  const { openAIClient } = createFakeOpenAIClient({ outputParsed: hotdogClassification });
  const { supabaseClient } = createFakeHotdogClassificationSupabaseClient();
  const { supabaseStorageClient, putFile, hasFile } = createFakeSupabaseStorageClient();
  const visitorSessionService = createStubVisitorSessionService();
  return {
    hotdogImageUploadHandler: new HotdogImageUploadHandler({
      supabaseStorageClient,
      visitorSessionService,
    }),
    hotdogClassificationHandler: new HotdogClassificationHandler({
      openAIClient,
      supabaseClient,
      supabaseStorageClient,
      visitorSessionService,
    }),
    putFile,
    hasFile,
  };
};

type HotdogApi = ReturnType<typeof createHotdogApi>;

/**
 * Routes controller requests into the handlers the same way `app/api/**​/route.ts` does,
 * PUTs to signed upload URLs into the fake storage, and carries the visitor cookie.
 */
const stubFetchWithHotdogApi = (hotdogApi: HotdogApi) => {
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

    if (visitorCookieJar.cookieHeader) {
      request.headers.set('cookie', visitorCookieJar.cookieHeader);
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

const createImageFile = ({ mediaType = 'image/jpeg', byteSize = 16 } = {}) => {
  return new Blob([new Uint8Array(byteSize)], { type: mediaType });
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

  it('uploads, classifies, and lists an image for the same visitor', async () => {
    const hotdogApi = createHotdogApi();
    const { getVisitorCookieHeader } = stubFetchWithHotdogApi(hotdogApi);

    const { tempImagePath } = await uploadImage(createImageFile());
    expect(getVisitorCookieHeader()).toMatch(new RegExp(`^${VISITOR_SESSION_COOKIE_NAME}=`));
    // The path is scoped by the non-secret folder id, never by the session id.
    expect(tempImagePath.startsWith(`${STUB_STORAGE_FOLDER_ID}/`)).toBe(true);

    const hotdogClassificationRecord = await hotdogClassificationController.classifyUploadedImage({
      tempImagePath,
    });
    expect(hotdogClassificationRecord).toMatchObject({
      ...hotdogClassification,
      imageUrl: expect.stringContaining(tempImagePath),
    });
    expect(
      hotdogApi.hasFile({ bucketId: STORAGE_BUCKET.HOTDOG_IMAGES, filePath: tempImagePath }),
    ).toBe(true);

    await expect(hotdogClassificationController.listClassifications()).resolves.toEqual({
      hotdogClassificationList: [hotdogClassificationRecord],
    });
  });
});
