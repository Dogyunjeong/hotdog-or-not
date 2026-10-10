/** Image formats the vision model accepts. */
export const HOTDOG_IMAGE_MEDIA_TYPE_LIST = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export type HotdogImageMediaType = (typeof HOTDOG_IMAGE_MEDIA_TYPE_LIST)[number];

/** Vercel functions reject request bodies over 4.5MB, so stay safely below it. */
export const HOTDOG_IMAGE_MAX_BYTE_SIZE = 4 * 1024 * 1024;

/** Multipart form field carrying the uploaded image. */
export const HOTDOG_IMAGE_FORM_FIELD_NAME = 'image';
