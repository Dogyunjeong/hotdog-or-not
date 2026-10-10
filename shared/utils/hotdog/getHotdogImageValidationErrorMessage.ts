import { HotdogTypes } from '@/shared/types';

const HOTDOG_IMAGE_MAX_MEGABYTE_SIZE = HotdogTypes.HOTDOG_IMAGE_MAX_BYTE_SIZE / (1024 * 1024);

export const isHotdogImageMediaType = (
  mediaType: string,
): mediaType is HotdogTypes.HotdogImageMediaType => {
  return (HotdogTypes.HOTDOG_IMAGE_MEDIA_TYPE_LIST as readonly string[]).includes(mediaType);
};

/**
 * Shared by the browser (instant feedback) and the API (source of truth).
 * Returns a user-facing message, or `undefined` when the image is acceptable.
 */
export const getHotdogImageValidationErrorMessage = ({
  mediaType,
  byteSize,
}: {
  mediaType: string;
  byteSize: number;
}): string | undefined => {
  if (!isHotdogImageMediaType(mediaType)) {
    return 'Please upload a JPEG, PNG, GIF, or WebP image.';
  }

  if (byteSize === 0) {
    return 'This image looks empty. Please try another one.';
  }

  if (byteSize > HotdogTypes.HOTDOG_IMAGE_MAX_BYTE_SIZE) {
    return `Please upload an image smaller than ${HOTDOG_IMAGE_MAX_MEGABYTE_SIZE}MB.`;
  }
  return undefined;
};
