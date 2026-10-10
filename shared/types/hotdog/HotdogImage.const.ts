/** Image formats the vision model accepts. Mirrored by the storage bucket migrations. */
export const HOTDOG_IMAGE_MEDIA_TYPE_LIST = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
] as const;

export type HotdogImageMediaType = (typeof HOTDOG_IMAGE_MEDIA_TYPE_LIST)[number];

/** 4MB. Mirrored by `file_size_limit` on the storage buckets. */
export const HOTDOG_IMAGE_MAX_BYTE_SIZE = 4 * 1024 * 1024;

/** For messages: "smaller than {maxMegabytes}MB". */
export const HOTDOG_IMAGE_MAX_MEGABYTE_SIZE = HOTDOG_IMAGE_MAX_BYTE_SIZE / (1024 * 1024);

/** History list cap per visitor. */
export const HOTDOG_CLASSIFICATION_HISTORY_LIMIT = 50;
