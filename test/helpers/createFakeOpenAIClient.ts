import type OpenAI from 'openai';
import { vi } from 'vitest';

const IMAGE_DATA_URL_PATTERN = /^data:[^;]+;base64,(.+)$/;

/** Fakes `responses.parse` with a fixed `output_parsed` (or a rejection). */
export const createFakeOpenAIClient = ({
  outputParsed = null,
  parseError,
}: { outputParsed?: unknown; parseError?: Error } = {}) => {
  const parse = parseError
    ? vi.fn().mockRejectedValue(parseError)
    : vi.fn().mockResolvedValue({ id: 'resp_test', output_parsed: outputParsed });

  /** Decoded bytes of every `input_image` the model was sent, in call order. */
  const getSentImageBufferList = () => {
    return parse.mock.calls.flatMap(([parseRequest]) =>
      parseRequest.input.flatMap((inputMessage: { content: { image_url?: string }[] }) =>
        inputMessage.content.flatMap(({ image_url: imageUrl }) => {
          const [, base64ImageData] = imageUrl?.match(IMAGE_DATA_URL_PATTERN) ?? [];

          if (!base64ImageData) {
            return [];
          }
          return [Buffer.from(base64ImageData, 'base64')];
        }),
      ),
    );
  };

  return {
    openAIClient: { responses: { parse } } as unknown as OpenAI,
    parse,
    getSentImageBufferList,
  };
};
