/** Stable codes the UI translates (`errors.<code>`); the API `message` is only an English fallback. */
export const API_ERROR_CODE_LIST = [
  'IMAGE_TYPE_UNSUPPORTED',
  'IMAGE_EMPTY',
  'IMAGE_TOO_LARGE',
  'IMAGE_UNREADABLE',
  'IMAGE_TOO_LARGE_TO_SAVE',
  'PHOTO_REQUIRED',
  'UPLOAD_EXPIRED',
  'UPLOAD_FAILED',
  'CLASSIFICATION_NOT_FOUND',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODE_LIST)[number];

/** Values interpolated into the translated message (e.g. `{ maxMegabytes: 4 }`). */
export type ApiErrorValues = Record<string, string | number>;

export interface ApiErrorResponse {
  message: string;
  errorCode?: ApiErrorCode;
  errorData?: unknown;
}
