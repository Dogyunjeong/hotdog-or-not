import { HotdogTypes, type SharedTypes } from '@/shared/types';

export interface HotdogImageValidationError {
  errorCode: SharedTypes.ApiErrorCode;
  /** Interpolated into the translated message. */
  errorValues?: SharedTypes.ApiErrorValues;
}

export const isHotdogImageMediaType = (
  mediaType: string,
): mediaType is HotdogTypes.HotdogImageMediaType => {
  return (HotdogTypes.HOTDOG_IMAGE_MEDIA_TYPE_LIST as readonly string[]).includes(mediaType);
};

/**
 * Shared by the browser (instant feedback) and the API (source of truth).
 * Returns the error to show, or `undefined` when the image is acceptable.
 */
export const getHotdogImageValidationError = ({
  mediaType,
  byteSize,
}: {
  mediaType: string;
  byteSize: number;
}): HotdogImageValidationError | undefined => {
  if (!isHotdogImageMediaType(mediaType)) {
    return { errorCode: 'IMAGE_TYPE_UNSUPPORTED' };
  }

  if (byteSize === 0) {
    return { errorCode: 'IMAGE_EMPTY' };
  }

  if (byteSize > HotdogTypes.HOTDOG_IMAGE_MAX_BYTE_SIZE) {
    return {
      errorCode: 'IMAGE_TOO_LARGE',
      errorValues: { maxMegabytes: HotdogTypes.HOTDOG_IMAGE_MAX_MEGABYTE_SIZE },
    };
  }
  return undefined;
};
