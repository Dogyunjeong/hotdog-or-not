import { HotdogTypes, type SharedTypes } from '@/shared/types';

/** English text sent as `message` next to each code, for API consumers that don't translate. */
export const API_ERROR_FALLBACK_MESSAGE: Record<SharedTypes.ApiErrorCode, string> = {
  IMAGE_TYPE_UNSUPPORTED: 'Please upload a JPEG, PNG, GIF, or WebP image.',
  IMAGE_EMPTY: 'This image looks empty. Please try another one.',
  IMAGE_TOO_LARGE: `Please upload an image smaller than ${HotdogTypes.HOTDOG_IMAGE_MAX_MEGABYTE_SIZE}MB.`,
  IMAGE_UNREADABLE:
    "We couldn't read that photo. Please try a different JPEG, PNG, GIF, or WebP image.",
  IMAGE_TOO_LARGE_TO_SAVE: 'This photo is too large to save. Please try a smaller one.',
  PHOTO_REQUIRED: 'Please choose a photo to check.',
  UPLOAD_EXPIRED: 'That upload has expired. Please pick your photo again.',
  UPLOAD_FAILED: 'We could not upload your image right now. Please try again in a moment.',
  CLASSIFICATION_NOT_FOUND: "We couldn't find that photo. It may already be deleted.",
};
