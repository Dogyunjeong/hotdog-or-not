import ExpectedServerError, { HTTP_STATUS } from '../error/ExpectedServerError';
import NetworkError from '../error/NetworkError';

const DEFAULT_UPLOAD_ERROR_MESSAGE =
  'We could not upload your image right now. Please try again in a moment.';

/**
 * PUTs a file to a storage signed upload URL (absolute, not under `/api`).
 * Storage rejects wrong types/sizes itself; those surface as one friendly message.
 * No response → `NetworkError`.
 */
export const uploadFileToSignedUrl = async ({
  signedUploadUrl,
  file,
  signal,
}: {
  signedUploadUrl: string;
  file: Blob;
  /** Cancels the upload (it then rejects with a `NetworkError`). */
  signal?: AbortSignal;
}): Promise<void> => {
  const response = await fetch(signedUploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
    signal,
  }).catch((fetchError: unknown) => {
    throw new NetworkError(fetchError);
  });

  if (!response.ok) {
    throw new ExpectedServerError(DEFAULT_UPLOAD_ERROR_MESSAGE, HTTP_STATUS.BAD_REQUEST, {
      storageStatus: response.status,
    });
  }
};
