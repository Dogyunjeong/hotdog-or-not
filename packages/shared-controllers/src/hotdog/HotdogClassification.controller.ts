import { HotdogTypes } from '@seamflow/shared-types';
import { FetchRequest, type IRequest } from '@seamflow/shared-utils/requests';

class HotdogClassificationController {
  private readonly _httpRequest: IRequest;

  constructor({ baseUrl = '', httpRequest }: { baseUrl?: string; httpRequest?: IRequest } = {}) {
    const apiUrl = `${baseUrl}/api`;
    httpRequest?.setBaseUrl(apiUrl);
    this._httpRequest = httpRequest || new FetchRequest({ baseUrl: apiUrl });
  }

  public classifyImage = async ({
    imageFile,
  }: {
    imageFile: Blob;
  }): Promise<HotdogTypes.HotdogClassification> => {
    const imageFormData = new FormData();
    imageFormData.append(HotdogTypes.HOTDOG_IMAGE_FORM_FIELD_NAME, imageFile);

    const response = await this._httpRequest.post<HotdogTypes.HotdogClassification>(
      '/hotdog-classifications',
      imageFormData,
    );
    return response.data;
  };
}

export default HotdogClassificationController;
