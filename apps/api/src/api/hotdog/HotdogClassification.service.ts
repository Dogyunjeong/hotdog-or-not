import { HotdogTypes } from '@seamflow/shared-types';
import { ExpectedServerError } from '@seamflow/shared-utils/error';
import { getHotdogImageValidationErrorMessage } from '@seamflow/shared-utils/hotdog';
import type OpenAI from 'openai';

import {
  HOTDOG_CLASSIFICATION_INSTRUCTIONS,
  HOTDOG_CLASSIFICATION_MODEL,
  HOTDOG_CLASSIFICATION_TEXT_FORMAT,
} from './HotdogClassification.prompt.ts';

class HotdogClassificationService {
  private _openAIClient: OpenAI;

  constructor({ openAIClient }: { openAIClient: OpenAI }) {
    this._openAIClient = openAIClient;
  }

  private _validateImageFile = (imageFile: File) => {
    const validationErrorMessage = getHotdogImageValidationErrorMessage({
      mediaType: imageFile.type,
      byteSize: imageFile.size,
    });

    if (validationErrorMessage) {
      throw new ExpectedServerError(validationErrorMessage);
    }
  };

  private _toImageDataUrl = async (imageFile: File): Promise<string> => {
    const imageBase64 = Buffer.from(await imageFile.arrayBuffer()).toString('base64');
    return `data:${imageFile.type};base64,${imageBase64}`;
  };

  public classifyImage = async ({
    imageFile,
  }: {
    imageFile: File;
  }): Promise<HotdogTypes.HotdogClassification> => {
    this._validateImageFile(imageFile);

    const parsedResponse = await this._openAIClient.responses.parse({
      model: HOTDOG_CLASSIFICATION_MODEL,
      instructions: HOTDOG_CLASSIFICATION_INSTRUCTIONS,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_image',
              image_url: await this._toImageDataUrl(imageFile),
              // Low detail is plenty to spot a hotdog and keeps cost and latency down.
              detail: 'low',
            },
          ],
        },
      ],
      text: { format: HOTDOG_CLASSIFICATION_TEXT_FORMAT },
    });

    if (!parsedResponse.output_parsed) {
      throw new Error(`Hotdog classification returned no parsed output (id: ${parsedResponse.id})`);
    }
    return parsedResponse.output_parsed;
  };
}

export default HotdogClassificationService;
