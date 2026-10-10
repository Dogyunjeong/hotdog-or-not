import HotdogImageUploadHandler from '@/server/api/hotdog/HotdogImageUpload.handler';

const hotdogImageUploadHandler = new HotdogImageUploadHandler();

export const POST = (request: Request) =>
  hotdogImageUploadHandler.createImageUploadSession(request);
