import { ExpectedServerError, NetworkError } from '@/shared/utils/error';
import { describe, expect, it } from 'vitest';

import {
  createHotdogClassificationFailure,
  HotdogClassificationStepError,
} from './hotdogClassificationFailure';

describe('createHotdogClassificationFailure', () => {
  it('maps each failure to the right copy and retryability', () => {
    const toFailure = (failedStep: HotdogClassificationStepError['failedStep'], error: unknown) =>
      createHotdogClassificationFailure(new HotdogClassificationStepError(failedStep, error));

    expect(toFailure('classifying', new NetworkError(new TypeError('fetch failed')))).toEqual({
      status: 'failed',
      errorMessage: 'You seem to be offline. Check your connection and try again.',
      canRetry: true,
    });
    expect(
      toFailure('classifying', new ExpectedServerError('That upload has expired.', 404)),
    ).toEqual({ status: 'failed', errorMessage: 'That upload has expired.', canRetry: false });
    expect(toFailure('classifying', new ExpectedServerError('', 500))).toEqual({
      status: 'failed',
      errorMessage: "We couldn't check your image right now. Please try again in a moment.",
      canRetry: true,
    });
    expect(toFailure('uploadingImage', new ExpectedServerError('Payload too large', 400))).toEqual({
      status: 'failed',
      errorMessage: "We couldn't upload your photo. Please try again.",
      canRetry: true,
    });
  });
});
