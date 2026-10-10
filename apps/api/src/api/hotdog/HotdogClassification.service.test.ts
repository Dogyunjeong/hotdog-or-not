import { ExpectedServerError } from '@seamflow/shared-utils/error';
import type OpenAI from 'openai';
import { describe, expect, it, vi } from 'vitest';

import HotdogClassificationService from './HotdogClassification.service.ts';

const createFakeOpenAIClient = (outputParsed: unknown) => {
  const parse = vi.fn().mockResolvedValue({ id: 'resp_test', output_parsed: outputParsed });
  return { openAIClient: { responses: { parse } } as unknown as OpenAI, parse };
};

const createImageFile = ({ mediaType = 'image/png', byteSize = 16 } = {}) => {
  return new File([new Uint8Array(byteSize)], 'image', { type: mediaType });
};

describe('HotdogClassificationService', () => {
  it('returns the parsed classification', async () => {
    const hotdogClassification = { isHotdog: true, reason: 'Sausage, bun, mustard. Hotdog.' };
    const { openAIClient } = createFakeOpenAIClient(hotdogClassification);
    const hotdogClassificationService = new HotdogClassificationService({ openAIClient });

    await expect(
      hotdogClassificationService.classifyImage({ imageFile: createImageFile() }),
    ).resolves.toEqual(hotdogClassification);
  });

  it('sends the image as a base64 data URL', async () => {
    const { openAIClient, parse } = createFakeOpenAIClient({ isHotdog: false, reason: 'A cat.' });
    const hotdogClassificationService = new HotdogClassificationService({ openAIClient });

    await hotdogClassificationService.classifyImage({ imageFile: createImageFile() });

    const [inputMessage] = parse.mock.calls[0][0].input;
    expect(inputMessage.content[0].image_url).toMatch(/^data:image\/png;base64,/);
  });

  it('rejects unsupported images without calling OpenAI', async () => {
    const { openAIClient, parse } = createFakeOpenAIClient(null);
    const hotdogClassificationService = new HotdogClassificationService({ openAIClient });

    await expect(
      hotdogClassificationService.classifyImage({
        imageFile: createImageFile({ mediaType: 'application/pdf' }),
      }),
    ).rejects.toBeInstanceOf(ExpectedServerError);
    expect(parse).not.toHaveBeenCalled();
  });

  it('throws an unexpected error when the model returns no parsed output', async () => {
    const { openAIClient } = createFakeOpenAIClient(null);
    const hotdogClassificationService = new HotdogClassificationService({ openAIClient });

    const classifyPromise = hotdogClassificationService.classifyImage({
      imageFile: createImageFile(),
    });
    await expect(classifyPromise).rejects.toThrow('no parsed output');
    await expect(classifyPromise).rejects.not.toBeInstanceOf(ExpectedServerError);
  });
});
