import type { HotdogTypes } from '@seamflow/shared-types';
import { ExpectedServerError } from '@seamflow/shared-utils/error';
import {
  getHotdogImageValidationErrorMessage,
  isHotdogImageMediaType,
} from '@seamflow/shared-utils/hotdog';
import type OpenAI from 'openai';

import {
  STORAGE_BUCKET,
  type SupabaseStorageClient,
} from '../../supabase/SupabaseStorage.client.ts';
import {
  HOTDOG_CLASSIFICATION_INSTRUCTIONS,
  HOTDOG_CLASSIFICATION_MODEL,
  HOTDOG_CLASSIFICATION_TEXT_FORMAT,
} from './HotdogClassification.prompt.ts';

const HOTDOG_IMAGE_FILE_EXTENSION: Record<HotdogTypes.HotdogImageMediaType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

class HotdogClassificationService {
  private _openAIClient: OpenAI;
  private _supabaseStorageClient: SupabaseStorageClient;

  constructor({
    openAIClient,
    supabaseStorageClient,
  }: {
    openAIClient: OpenAI;
    supabaseStorageClient: SupabaseStorageClient;
  }) {
    this._openAIClient = openAIClient;
    this._supabaseStorageClient = supabaseStorageClient;
  }

  private _getValidatedMediaType = (imageFile: File): HotdogTypes.HotdogImageMediaType => {
    const validationErrorMessage = getHotdogImageValidationErrorMessage({
      mediaType: imageFile.type,
      byteSize: imageFile.size,
    });

    if (validationErrorMessage || !isHotdogImageMediaType(imageFile.type)) {
      throw new ExpectedServerError(validationErrorMessage);
    }
    return imageFile.type;
  };

  /** `YYYY-MM-DD/<uuid>.<ext>` — date prefix keeps the bucket browsable. */
  private _createImageFilePath = (mediaType: HotdogTypes.HotdogImageMediaType) => {
    const uploadDate = new Date().toISOString().slice(0, 10);
    return `${uploadDate}/${crypto.randomUUID()}.${HOTDOG_IMAGE_FILE_EXTENSION[mediaType]}`;
  };

  private _storeImage = (imageBuffer: Buffer, mediaType: HotdogTypes.HotdogImageMediaType) => {
    return this._supabaseStorageClient.uploadFile({
      bucketId: STORAGE_BUCKET.HOTDOG_IMAGES,
      filePath: this._createImageFilePath(mediaType),
      fileBody: imageBuffer,
      contentType: mediaType,
    });
  };

  private _askVisionModel = async (
    imageBuffer: Buffer,
    mediaType: HotdogTypes.HotdogImageMediaType,
  ): Promise<HotdogTypes.HotdogClassification> => {
    const parsedResponse = await this._openAIClient.responses.parse({
      model: HOTDOG_CLASSIFICATION_MODEL,
      instructions: HOTDOG_CLASSIFICATION_INSTRUCTIONS,
      input: [
        {
          role: 'user',
          content: [
            {
              type: 'input_image',
              image_url: `data:${mediaType};base64,${imageBuffer.toString('base64')}`,
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

  /**
   * Validate once, then store the image and ask the vision model in parallel.
   * Both must succeed so every verdict has its image stored.
   */
  public classifyImage = async ({
    imageFile,
  }: {
    imageFile: File;
  }): Promise<HotdogTypes.HotdogClassification> => {
    const mediaType = this._getValidatedMediaType(imageFile);
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());

    const [, hotdogClassification] = await Promise.all([
      this._storeImage(imageBuffer, mediaType),
      this._askVisionModel(imageBuffer, mediaType),
    ]);
    return hotdogClassification;
  };
}

export default HotdogClassificationService;
