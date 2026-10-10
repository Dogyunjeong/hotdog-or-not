import type { HotdogTypes } from '@/shared/types';

import ExpectedServerError from '../error/ExpectedServerError';
import {
  getHotdogImageValidationError,
  isHotdogImageMediaType,
} from './getHotdogImageValidationError';

/**
 * Server-side gate: validates an image's type/size and narrows its media type,
 * or throws a 400 `ExpectedServerError` with the error code.
 */
export const getValidatedHotdogImageMediaType = ({
  mediaType,
  byteSize,
}: {
  mediaType: string;
  byteSize: number;
}): HotdogTypes.HotdogImageMediaType => {
  const validationError = getHotdogImageValidationError({ mediaType, byteSize });

  if (validationError || !isHotdogImageMediaType(mediaType)) {
    throw new ExpectedServerError({
      errorCode: validationError?.errorCode ?? 'IMAGE_TYPE_UNSUPPORTED',
    });
  }
  return mediaType;
};
