import { connection } from 'next/server';

import HotdogClassificationHandler from '@/server/api/hotdog/HotdogClassification.handler';

const hotdogClassificationHandler = new HotdogClassificationHandler();

export const GET = async (request: Request) => {
  // Per-visitor data: opt out of prerendering before the handler reads cookies.
  await connection();
  return hotdogClassificationHandler.listHotdogClassifications(request);
};

export const POST = (request: Request) =>
  hotdogClassificationHandler.classifyUploadedImage(request);
