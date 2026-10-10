import { ExpectedServerError, NetworkError } from '@/shared/utils/error';

export type HotdogClassificationStep = 'creatingUploadSession' | 'uploadingImage' | 'classifying';

export interface HotdogClassificationFailure {
  status: 'failed';
  errorMessage: string;
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

const UPLOAD_ERROR_MESSAGE = "We couldn't upload your photo. Please try again.";
const CLASSIFICATION_ERROR_MESSAGE =
  "We couldn't check your image right now. Please try again in a moment.";
const OFFLINE_ERROR_MESSAGE = 'You seem to be offline. Check your connection and try again.';

const isOfflineError = (error: unknown) => {
  return error instanceof NetworkError || navigator.onLine === false;
};

/**
 * API errors carry a friendly message (empty when the body wasn't JSON). A 4xx (invalid photo,
 * expired upload) won't succeed on a repeat, so only server-side failures are retryable.
 */
const createApiFailure = (
  error: unknown,
  defaultErrorMessage: string,
): HotdogClassificationFailure => {
  if (!(error instanceof ExpectedServerError)) {
    return { status: 'failed', errorMessage: defaultErrorMessage, canRetry: true };
  }
  return {
    status: 'failed',
    errorMessage: error.message || defaultErrorMessage,
    canRetry: error.httpStatusCode >= ExpectedServerError.HTTP_STATUS.INTERNAL_ERROR,
  };
};

export const createHotdogClassificationFailure = (
  stepError: HotdogClassificationStepError,
): HotdogClassificationFailure => {
  const { failedStep, cause } = stepError;

  if (isOfflineError(cause)) {
    return { status: 'failed', errorMessage: OFFLINE_ERROR_MESSAGE, canRetry: true };
  }

  switch (failedStep) {
    case 'creatingUploadSession':
      return createApiFailure(cause, UPLOAD_ERROR_MESSAGE);
    case 'uploadingImage':
      // Storage errors aren't user-friendly; a retry starts a fresh upload session.
      return { status: 'failed', errorMessage: UPLOAD_ERROR_MESSAGE, canRetry: true };
    case 'classifying':
      return createApiFailure(cause, CLASSIFICATION_ERROR_MESSAGE);
  }
};

/** Anything that isn't a tagged step error is a bug in the flow itself. */
export const toHotdogClassificationStepError = (error: unknown) => {
  if (error instanceof HotdogClassificationStepError) {
    return error;
  }
  return new HotdogClassificationStepError('classifying', error);
};
