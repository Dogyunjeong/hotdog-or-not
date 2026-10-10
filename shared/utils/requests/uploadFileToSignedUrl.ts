import ExpectedServerError, { HTTP_STATUS } from '../error/ExpectedServerError';
import NetworkError from '../error/NetworkError';

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
    throw new ExpectedServerError({
      errorCode: 'UPLOAD_FAILED',
      httpStatusCode: HTTP_STATUS.BAD_REQUEST,
      errorData: { storageStatus: response.status },
    });
  }
};
