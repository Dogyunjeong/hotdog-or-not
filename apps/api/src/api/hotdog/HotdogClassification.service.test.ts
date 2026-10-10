import { ExpectedServerError } from '@seamflow/shared-utils/error';
import { describe, expect, it } from 'vitest';

import { createFakeOpenAIClient } from '../../../../../test/helpers/createFakeOpenAIClient.ts';
import { createFakeSupabaseStorageClient } from '../../../../../test/helpers/createFakeSupabaseStorageClient.ts';
import HotdogClassificationService from './HotdogClassification.service.ts';

const hotdogClassification = { isHotdog: true, reason: 'Classic ballpark dog.' };

const createHotdogClassificationService = ({
  outputParsed = hotdogClassification,
  uploadError,
}: { outputParsed?: unknown; uploadError?: Error } = {}) => {
  const { openAIClient, parse } = createFakeOpenAIClient({ outputParsed });
  const { supabaseStorageClient, upload } = createFakeSupabaseStorageClient({ uploadError });
  const hotdogClassificationService = new HotdogClassificationService({
    openAIClient,
    supabaseStorageClient,
  });
  return { hotdogClassificationService, parse, upload };
};

const createImageFile = ({ mediaType = 'image/png', byteSize = 16 } = {}) => {
  return new File([new Uint8Array(byteSize)], 'image', { type: mediaType });
};

describe('HotdogClassificationService', () => {
  it('stores the image and returns the classification', async () => {
    const { hotdogClassificationService, upload } = createHotdogClassificationService();

    await expect(
      hotdogClassificationService.classifyImage({ imageFile: createImageFile() }),
    ).resolves.toEqual(hotdogClassification);
    expect(upload).toHaveBeenCalledOnce();
  });

  it('stores the image under a dated, unique path', async () => {
    const { hotdogClassificationService, upload } = createHotdogClassificationService();

    await hotdogClassificationService.classifyImage({
      imageFile: createImageFile({ mediaType: 'image/webp' }),
    });

    const [filePath] = upload.mock.calls[0];
    expect(filePath).toMatch(/^\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}\.webp$/);
  });

  it('sends the image to the vision model as a base64 data URL', async () => {
    const { hotdogClassificationService, parse } = createHotdogClassificationService();

    await hotdogClassificationService.classifyImage({ imageFile: createImageFile() });

    const [inputMessage] = parse.mock.calls[0][0].input;
    expect(inputMessage.content[0].image_url).toMatch(/^data:image\/png;base64,/);
  });

  it('rejects unsupported images before storing or classifying', async () => {
    const { hotdogClassificationService, parse, upload } = createHotdogClassificationService();

    await expect(
      hotdogClassificationService.classifyImage({
        imageFile: createImageFile({ mediaType: 'application/pdf' }),
      }),
    ).rejects.toBeInstanceOf(ExpectedServerError);
    expect(upload).not.toHaveBeenCalled();
    expect(parse).not.toHaveBeenCalled();
  });

  it('fails when the image cannot be stored', async () => {
    const uploadError = new Error('storage down');
    const { hotdogClassificationService } = createHotdogClassificationService({ uploadError });

    await expect(
      hotdogClassificationService.classifyImage({ imageFile: createImageFile() }),
    ).rejects.toBe(uploadError);
  });

  it('fails when the model returns no parsed output', async () => {
    const { hotdogClassificationService } = createHotdogClassificationService({
      outputParsed: null,
    });

    await expect(
      hotdogClassificationService.classifyImage({ imageFile: createImageFile() }),
    ).rejects.toThrow('no parsed output');
  });
});
