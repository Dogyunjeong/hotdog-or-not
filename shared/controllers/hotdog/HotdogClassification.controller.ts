import type { HotdogTypes } from '@/shared/types';
import { FetchRequest, type IRequest, uploadFileToSignedUrl } from '@/shared/utils/requests';

class HotdogClassificationController {
  private readonly _httpRequest: IRequest;

  constructor({ baseUrl = '', httpRequest }: { baseUrl?: string; httpRequest?: IRequest } = {}) {
    const apiUrl = `${baseUrl}/api`;
    httpRequest?.setBaseUrl(apiUrl);
    this._httpRequest = httpRequest || new FetchRequest({ baseUrl: apiUrl });
  }

  public createImageUploadSession = async (
    createHotdogImageUploadRequest: HotdogTypes.CreateHotdogImageUploadRequest,
  ): Promise<HotdogTypes.HotdogImageUploadSession> => {
    const response = await this._httpRequest.post<HotdogTypes.HotdogImageUploadSession>(
      '/hotdog-image-uploads',
      createHotdogImageUploadRequest,
    );
    return response.data;
  };

  /** Uploads straight to storage — the file never passes through the API. */
  public uploadImage = async ({
    hotdogImageUploadSession,
    imageFile,
  }: {
    hotdogImageUploadSession: HotdogTypes.HotdogImageUploadSession;
    imageFile: Blob;
  }): Promise<void> => {
    await uploadFileToSignedUrl({
      signedUploadUrl: hotdogImageUploadSession.uploadUrl,
      file: imageFile,
    });
  };

  public classifyUploadedImage = async (
    classifyUploadedHotdogImageRequest: HotdogTypes.ClassifyUploadedHotdogImageRequest,
  ): Promise<HotdogTypes.HotdogClassificationRecord> => {
    const response = await this._httpRequest.post<HotdogTypes.HotdogClassificationRecord>(
      '/hotdog-classifications',
      classifyUploadedHotdogImageRequest,
    );
    return response.data;
  };

  public listClassifications = async (): Promise<HotdogTypes.HotdogClassificationListResponse> => {
    const response =
      await this._httpRequest.get<HotdogTypes.HotdogClassificationListResponse>(
        '/hotdog-classifications',
      );
    return response.data;
  };
}

export default HotdogClassificationController;
