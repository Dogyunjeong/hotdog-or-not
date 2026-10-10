import { HotdogTypes, type SharedTypes } from '@/shared/types';
import { ExpectedServerError, NetworkError } from '@/shared/utils/error';

export type HotdogClassificationStep = 'creatingUploadSession' | 'uploadingImage' | 'classifying';

/** Keys of the `errors` messages: API codes plus the client-only fallbacks. */
export type HotdogClassificationErrorKey =
  SharedTypes.ApiErrorCode | 'UPLOAD_FAILED' | 'CLASSIFICATION_FAILED' | 'OFFLINE';

/** Carries a translation key (render it with `useApiErrorMessage`), never display text. */
export interface HotdogClassificationFailure {
  status: 'failed';
  errorKey: HotdogClassificationErrorKey;
  errorValues?: SharedTypes.ApiErrorValues;
  canRetry: boolean;
}

/** Tags an error with the step it happened in, so the failure copy can match the step. */
export class HotdogClassificationStepError extends Error {
  public readonly failedStep: HotdogClassificationStep;

  constructor(failedStep: HotdogClassificationStep, cause: unknown) {
    super(`Hotdog classification failed while ${failedStep}`, { cause });
    this.failedStep = failedStep;
  }
}

export const runHotdogClassificationStep = <T>(
  step: HotdogClassificationStep,
  runStep: () => Promise<T>,
): Promise<T> => {
  return runStep().catch((error: unknown) => {
    throw new HotdogClassificationStepError(step, error);
  });
};

const isOfflineError = (error: unknown) => {
  return error instanceof NetworkError || navigator.onLine === false;
};

const getApiErrorValues = (errorCode: SharedTypes.ApiErrorCode) => {
  if (errorCode === 'IMAGE_TOO_LARGE') {
    return { maxMegabytes: HotdogTypes.HOTDOG_IMAGE_MAX_MEGABYTE_SIZE };
  }
  return undefined;
};

/**
 * API errors carry a stable code (absent when the body wasn't our JSON). A 4xx (invalid photo,
 * expired upload) won't succeed on a repeat, so only server-side failures are retryable.
 */
const createApiFailure = (
  error: unknown,
  defaultErrorKey: HotdogClassificationErrorKey,
): HotdogClassificationFailure => {
  if (!(error instanceof ExpectedServerError)) {
    return { status: 'failed', errorKey: defaultErrorKey, canRetry: true };
  }
  return {
    status: 'failed',
    errorKey: error.errorCode ?? defaultErrorKey,
    errorValues: error.errorCode && getApiErrorValues(error.errorCode),
    canRetry: error.httpStatusCode >= ExpectedServerError.HTTP_STATUS.INTERNAL_ERROR,
  };
};

export const createHotdogClassificationFailure = (
  stepError: HotdogClassificationStepError,
): HotdogClassificationFailure => {
  const { failedStep, cause } = stepError;

  if (isOfflineError(cause)) {
    return { status: 'failed', errorKey: 'OFFLINE', canRetry: true };
  }

  switch (failedStep) {
    case 'creatingUploadSession':
      return createApiFailure(cause, 'UPLOAD_FAILED');
    case 'uploadingImage':
      // Storage errors aren't user-friendly; a retry starts a fresh upload session.
      return { status: 'failed', errorKey: 'UPLOAD_FAILED', canRetry: true };
    case 'classifying':
      return createApiFailure(cause, 'CLASSIFICATION_FAILED');
  }
};

/** Anything that isn't a tagged step error is a bug in the flow itself. */
export const toHotdogClassificationStepError = (error: unknown) => {
  if (error instanceof HotdogClassificationStepError) {
    return error;
  }
  return new HotdogClassificationStepError('classifying', error);
};
