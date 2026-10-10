import { HotdogTypes } from '@seamflow/shared-types';
import { ExpectedServerError } from '@seamflow/shared-utils/error';
import type OpenAI from 'openai';

import { getOpenAIClient } from '../../openai/getOpenAIClient.ts';
import { handleError } from '../../utils/handleError.ts';
import HotdogClassificationService from './HotdogClassification.service.ts';

class HotdogClassificationHandler {
  private _openAIClient?: OpenAI;

  /** `openAIClient` is injectable for tests; production resolves it lazily from env. */
  constructor({ openAIClient }: { openAIClient?: OpenAI } = {}) {
    this._openAIClient = openAIClient;
  }

  private _getDependencies = () => {
    const hotdogClassificationService = new HotdogClassificationService({
      openAIClient: this._openAIClient || getOpenAIClient(),
    });
    return { hotdogClassificationService };
  };

  private _getImageFile = async (request: Request): Promise<File> => {
    // A missing or non-multipart body is a client mistake, not a server failure.
    const formData = await request.formData().catch(() => undefined);
    const imageFile = formData?.get(HotdogTypes.HOTDOG_IMAGE_FORM_FIELD_NAME);

    if (!(imageFile instanceof File)) {
      throw new ExpectedServerError('Please choose an image to check.');
    }
    return imageFile;
  };

  public classifyImage = async (request: Request): Promise<Response> => {
    try {
      const imageFile = await this._getImageFile(request);
      const { hotdogClassificationService } = this._getDependencies();
      const hotdogClassification = await hotdogClassificationService.classifyImage({ imageFile });
      return Response.json(hotdogClassification);
    } catch (error) {
      return handleError({
        error,
        defaultMessage: 'We could not check your image right now. Please try again in a moment.',
      });
    }
  };
}

export default HotdogClassificationHandler;
