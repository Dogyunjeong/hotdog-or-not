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
      errorKey: 'OFFLINE',
      canRetry: true,
    });
    expect(
      toFailure(
        'classifying',
        new ExpectedServerError({ errorCode: 'UPLOAD_EXPIRED', httpStatusCode: 404 }),
      ),
    ).toEqual({ status: 'failed', errorKey: 'UPLOAD_EXPIRED', canRetry: false });
    expect(toFailure('classifying', new ExpectedServerError({ httpStatusCode: 500 }))).toEqual({
      status: 'failed',
      errorKey: 'CLASSIFICATION_FAILED',
      canRetry: true,
    });
    expect(
      toFailure('uploadingImage', new ExpectedServerError({ message: 'Payload too large' })),
    ).toEqual({
      status: 'failed',
      errorKey: 'UPLOAD_FAILED',
      canRetry: true,
    });
  });
});
