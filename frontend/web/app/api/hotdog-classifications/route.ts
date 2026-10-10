import { HotdogClassificationHandler } from '@seamflow/api';

const hotdogClassificationHandler = new HotdogClassificationHandler();

export const POST = (request: Request) => hotdogClassificationHandler.classifyImage(request);
