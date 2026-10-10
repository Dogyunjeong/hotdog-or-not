import { HotdogClassificationHandler } from '@seamflow/api';
import { HotdogClassificationController } from '@seamflow/shared-controllers';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { createFakeOpenAIClient } from '../../helpers/createFakeOpenAIClient.ts';
import { createFakeSupabaseStorageClient } from '../../helpers/createFakeSupabaseStorageClient.ts';

const TEST_BASE_URL = 'http://localhost';

/**
 * Routes controller requests straight into the handler, the same way
 * `app/api/hotdog-classifications/route.ts` does — no running server needed.
 */
const stubFetchWithHandler = (hotdogClassificationHandler: HotdogClassificationHandler) => {
  vi.stubGlobal('fetch', (input: RequestInfo | URL, init?: RequestInit) =>
    hotdogClassificationHandler.classifyImage(new Request(input, init)),
  );
};

describe('POST /api/hotdog-classifications', () => {
  let hotdogClassificationController: HotdogClassificationController;

  beforeEach(() => {
    hotdogClassificationController = new HotdogClassificationController({
      baseUrl: TEST_BASE_URL,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('stores and classifies an uploaded image', async () => {
    const hotdogClassification = { isHotdog: true, reason: 'Classic ballpark dog.' };
    const { openAIClient } = createFakeOpenAIClient({ outputParsed: hotdogClassification });
    const { supabaseStorageClient, upload } = createFakeSupabaseStorageClient();
    stubFetchWithHandler(new HotdogClassificationHandler({ openAIClient, supabaseStorageClient }));

    const imageFile = new Blob([new Uint8Array(16)], { type: 'image/jpeg' });
    await expect(hotdogClassificationController.classifyImage({ imageFile })).resolves.toEqual(
      hotdogClassification,
    );
    expect(upload).toHaveBeenCalledOnce();
  });

  it('returns 400 with a friendly message for unsupported files', async () => {
    const { openAIClient } = createFakeOpenAIClient();
    const { supabaseStorageClient } = createFakeSupabaseStorageClient();
    stubFetchWithHandler(new HotdogClassificationHandler({ openAIClient, supabaseStorageClient }));

    const textFile = new Blob(['not an image'], { type: 'text/plain' });
    await expect(
      hotdogClassificationController.classifyImage({ imageFile: textFile }),
    ).rejects.toMatchObject({
      httpStatusCode: 400,
      message: 'Please upload a JPEG, PNG, GIF, or WebP image.',
    });
  });

  it('returns 400 when the request has no image', async () => {
    const hotdogClassificationHandler = new HotdogClassificationHandler();

    const response = await hotdogClassificationHandler.classifyImage(
      new Request(`${TEST_BASE_URL}/api/hotdog-classifications`, { method: 'POST' }),
    );
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({ message: 'Please choose an image to check.' });
  });

  it('hides unexpected failures behind a friendly 500', async () => {
    const { openAIClient } = createFakeOpenAIClient();
    const { supabaseStorageClient } = createFakeSupabaseStorageClient({
      uploadError: new Error('storage down'),
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    stubFetchWithHandler(new HotdogClassificationHandler({ openAIClient, supabaseStorageClient }));

    const imageFile = new Blob([new Uint8Array(16)], { type: 'image/png' });
    await expect(hotdogClassificationController.classifyImage({ imageFile })).rejects.toMatchObject(
      {
        httpStatusCode: 500,
        message: 'We could not check your image right now. Please try again in a moment.',
      },
    );
  });
});
