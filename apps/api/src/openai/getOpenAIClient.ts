import OpenAI from 'openai';

import { getEnvironmentVariable } from '../configs/app.config.ts';

let openAIClient: OpenAI | undefined;

export const getOpenAIClient = (): OpenAI => {
  if (openAIClient) {
    return openAIClient;
  }

  openAIClient = new OpenAI({ apiKey: getEnvironmentVariable('OPENAI_API_KEY') });
  return openAIClient;
};
