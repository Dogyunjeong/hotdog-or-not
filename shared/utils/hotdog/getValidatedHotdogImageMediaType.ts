import type { HotdogTypes } from '@/shared/types';

import ExpectedServerError from '../error/ExpectedServerError';
import {
  getHotdogImageValidationErrorMessage,
  isHotdogImageMediaType,
} from './getHotdogImageValidationErrorMessage';

/**
 * Server-side gate: validates an image's type/size and narrows its media type,
 * or throws a 400 `ExpectedServerError` with the user-facing message.
 */
export const getValidatedHotdogImageMediaType = ({
  mediaType,
  byteSize,
}: {
  mediaType: string;
  byteSize: number;
}): HotdogTypes.HotdogImageMediaType => {
  const validationErrorMessage = getHotdogImageValidationErrorMessage({ mediaType, byteSize });

  if (validationErrorMessage || !isHotdogImageMediaType(mediaType)) {
    throw new ExpectedServerError(validationErrorMessage);
  }
  return mediaType;
};
