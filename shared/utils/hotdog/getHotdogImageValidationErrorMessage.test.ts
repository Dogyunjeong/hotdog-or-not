import { HotdogTypes } from '@/shared/types';
import { describe, expect, it } from 'vitest';

import { getHotdogImageValidationErrorMessage } from './getHotdogImageValidationErrorMessage';

describe('getHotdogImageValidationErrorMessage', () => {
  it('accepts a supported image within the size limit', () => {
    expect(getHotdogImageValidationErrorMessage({ mediaType: 'image/png', byteSize: 1024 })).toBe(
      undefined,
    );
  });

  it('rejects unsupported media types', () => {
    expect(
      getHotdogImageValidationErrorMessage({ mediaType: 'application/pdf', byteSize: 1024 }),
    ).toBe('Please upload a JPEG, PNG, GIF, or WebP image.');
  });

  it('rejects empty images', () => {
    expect(getHotdogImageValidationErrorMessage({ mediaType: 'image/png', byteSize: 0 })).toBe(
      'This image looks empty. Please try another one.',
    );
  });

  it('rejects images over the size limit', () => {
    expect(
      getHotdogImageValidationErrorMessage({
        mediaType: 'image/jpeg',
        byteSize: HotdogTypes.HOTDOG_IMAGE_MAX_BYTE_SIZE + 1,
      }),
    ).toBe('Please upload an image smaller than 4MB.');
  });
});
