import type { HotdogTypes } from '@/shared/types';
import {
  FetchRequest,
  type IRequest,
  type RequestOptions,
  uploadFileToSignedUrl,
} from '@/shared/utils/requests';

class HotdogClassificationController {
  private readonly _httpRequest: IRequest;

  constructor({ baseUrl = '', httpRequest }: { baseUrl?: string; httpRequest?: IRequest } = {}) {
    const apiUrl = `${baseUrl}/api`;
    httpRequest?.setBaseUrl(apiUrl);
    this._httpRequest = httpRequest || new FetchRequest({ baseUrl: apiUrl });
  }

  public createImageUploadSession = async (
    createHotdogImageUploadRequest: HotdogTypes.CreateHotdogImageUploadRequest,
    requestOptions?: RequestOptions,
  ): Promise<HotdogTypes.HotdogImageUploadSession> => {
    const response = await this._httpRequest.post<HotdogTypes.HotdogImageUploadSession>(
      '/hotdog-image-uploads',
      createHotdogImageUploadRequest,
      requestOptions,
    );
    return response.data;
  };

  /** Uploads straight to storage — the file never passes through the API. */
  public uploadImage = async ({
    hotdogImageUploadSession,
    imageFile,
    signal,
  }: {
    hotdogImageUploadSession: HotdogTypes.HotdogImageUploadSession;
    imageFile: Blob;
    signal?: AbortSignal;
  }): Promise<void> => {
    await uploadFileToSignedUrl({
      signedUploadUrl: hotdogImageUploadSession.uploadUrl,
      file: imageFile,
      signal,
    });
  };

  public classifyUploadedImage = async (
    classifyUploadedHotdogImageRequest: HotdogTypes.ClassifyUploadedHotdogImageRequest,
    requestOptions?: RequestOptions,
  ): Promise<HotdogTypes.HotdogClassificationRecord> => {
    const response = await this._httpRequest.post<HotdogTypes.HotdogClassificationRecord>(
      '/hotdog-classifications',
      classifyUploadedHotdogImageRequest,
      requestOptions,
    );
    return response.data;
  };

  /** Permanently deletes one saved result and its image. 404 when it's already gone. */
  public deleteClassification = async ({
    hotdogClassificationId,
  }: {
    hotdogClassificationId: string;
  }): Promise<void> => {
    await this._httpRequest.delete(
      `/hotdog-classifications/${encodeURIComponent(hotdogClassificationId)}`,
    );
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
