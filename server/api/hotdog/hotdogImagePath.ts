import type { HotdogTypes } from '@/shared/types';

const HOTDOG_IMAGE_FILE_EXTENSION: Record<HotdogTypes.HotdogImageMediaType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

const HOTDOG_IMAGE_FILE_NAME_PATTERN = new RegExp(
  `^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(${Object.values(HOTDOG_IMAGE_FILE_EXTENSION).join('|')})$`,
);

/**
 * `{storageFolderId}/{uuid}.{ext}` — the same path is used in the temp upload bucket
 * and in the destination bucket, so ownership is readable from the path itself.
 * Uses the session's non-secret folder id: the session id is a bearer secret.
 */
export const createHotdogImagePath = ({
  storageFolderId,
  mediaType,
}: {
  storageFolderId: string;
  mediaType: HotdogTypes.HotdogImageMediaType;
}) => {
  return `${storageFolderId}/${crypto.randomUUID()}.${HOTDOG_IMAGE_FILE_EXTENSION[mediaType]}`;
};

/** True only for a well-formed path directly inside the given folder. */
export const isHotdogImagePathInStorageFolder = ({
  hotdogImagePath,
  storageFolderId,
}: {
  hotdogImagePath: string;
  storageFolderId: string;
}) => {
  const storageFolderPrefix = `${storageFolderId}/`;

  if (!hotdogImagePath.startsWith(storageFolderPrefix)) {
    return false;
  }
  return HOTDOG_IMAGE_FILE_NAME_PATTERN.test(hotdogImagePath.slice(storageFolderPrefix.length));
};
