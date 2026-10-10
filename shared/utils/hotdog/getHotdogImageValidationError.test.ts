import { HotdogTypes } from '@/shared/types';
import { describe, expect, it } from 'vitest';

import { getHotdogImageValidationError } from './getHotdogImageValidationError';

describe('getHotdogImageValidationError', () => {
  it('accepts a supported image within the size limit', () => {
    expect(getHotdogImageValidationError({ mediaType: 'image/png', byteSize: 1024 })).toBe(
      undefined,
    );
  });

  it('rejects unsupported media types', () => {
    expect(getHotdogImageValidationError({ mediaType: 'application/pdf', byteSize: 1024 })).toEqual(
      { errorCode: 'IMAGE_TYPE_UNSUPPORTED' },
    );
  });

  it('rejects empty images', () => {
    expect(getHotdogImageValidationError({ mediaType: 'image/png', byteSize: 0 })).toEqual({
      errorCode: 'IMAGE_EMPTY',
    });
  });

  it('rejects images over the size limit, with the limit to show', () => {
    expect(
      getHotdogImageValidationError({
        mediaType: 'image/jpeg',
        byteSize: HotdogTypes.HOTDOG_IMAGE_MAX_BYTE_SIZE + 1,
      }),
    ).toEqual({ errorCode: 'IMAGE_TOO_LARGE', errorValues: { maxMegabytes: 4 } });
  });
});
