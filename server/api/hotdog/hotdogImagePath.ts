import type { HotdogTypes } from '@/shared/types';

const HOTDOG_IMAGE_FILE_EXTENSION: Record<HotdogTypes.HotdogImageMediaType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

const UUID_PATTERN_SOURCE = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const HOTDOG_IMAGE_FILE_NAME_PATTERN_SOURCE = `${UUID_PATTERN_SOURCE}\\.(${Object.values(HOTDOG_IMAGE_FILE_EXTENSION).join('|')})`;

const HOTDOG_IMAGE_FILE_NAME_PATTERN = new RegExp(`^${HOTDOG_IMAGE_FILE_NAME_PATTERN_SOURCE}$`);

/** Guests have no storage folder; each guest upload gets its own random one under `guest/`. */
const GUEST_STORAGE_FOLDER_ROOT = 'guest';

const GUEST_HOTDOG_IMAGE_PATH_PATTERN = new RegExp(
  `^${GUEST_STORAGE_FOLDER_ROOT}/${UUID_PATTERN_SOURCE}/${HOTDOG_IMAGE_FILE_NAME_PATTERN_SOURCE}$`,
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

/**
 * `guest/{uuid}/{uuid}.{ext}` — temp bucket only (guest images are never stored).
 * Two random uuids make the path unguessable, so holding it is the proof of ownership.
 */
export const createGuestHotdogImagePath = ({
  mediaType,
}: {
  mediaType: HotdogTypes.HotdogImageMediaType;
}) => {
  return createHotdogImagePath({
    storageFolderId: `${GUEST_STORAGE_FOLDER_ROOT}/${crypto.randomUUID()}`,
    mediaType,
  });
};

const HOTDOG_IMAGE_FILE_EXTENSION_PATTERN = /\.[a-z]+$/;

/**
 * Stored keys in `hotdog-images`, derived from the temp upload key `{folder}/{uuid}.{ext}`:
 * the sanitized original `{folder}/{uuid}.webp` and its `{folder}/{uuid}.thumbnail.webp` —
 * flat in the same folder, so listing the folder (erase-all) finds both. A thumbnail key never
 * matches the upload path pattern, so it can't be submitted for classification.
 */
export const createHotdogImageOriginalPath = (tempImagePath: string) => {
  return tempImagePath.replace(HOTDOG_IMAGE_FILE_EXTENSION_PATTERN, '.webp');
};

export const createHotdogImageThumbnailPath = (tempImagePath: string) => {
  return tempImagePath.replace(HOTDOG_IMAGE_FILE_EXTENSION_PATTERN, '.thumbnail.webp');
};

/**
 * Every temp upload key a stored original can come from (`{folder}/{uuid}.{any upload ext}`):
 * the upload's own extension isn't saved, so deleting all candidates is how it's cleaned up.
 */
export const createHotdogTempImagePathCandidateList = (originalImagePath: string) => {
  return Object.values(HOTDOG_IMAGE_FILE_EXTENSION).map((fileExtension) =>
    originalImagePath.replace(HOTDOG_IMAGE_FILE_EXTENSION_PATTERN, `.${fileExtension}`),
  );
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

/** True only for a well-formed path created by `createGuestHotdogImagePath`. */
export const isGuestHotdogImagePath = (hotdogImagePath: string) => {
  return GUEST_HOTDOG_IMAGE_PATH_PATTERN.test(hotdogImagePath);
};
