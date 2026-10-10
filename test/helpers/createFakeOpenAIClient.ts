import type OpenAI from 'openai';
import { vi } from 'vitest';

/** Fakes `responses.parse` with a fixed `output_parsed` (or a rejection). */
export const createFakeOpenAIClient = ({
  outputParsed = null,
  parseError,
}: { outputParsed?: unknown; parseError?: Error } = {}) => {
  const parse = parseError
    ? vi.fn().mockRejectedValue(parseError)
    : vi.fn().mockResolvedValue({ id: 'resp_test', output_parsed: outputParsed });
  return { openAIClient: { responses: { parse } } as unknown as OpenAI, parse };
};
