import sharp from 'sharp';
import { describe, expect, it } from 'vitest';

import { createTestHotdogImageBuffer } from '@/test/helpers/createTestHotdogImageBuffer';
import { sanitizeHotdogImage } from './sanitizeHotdogImage';

const SVG_IMAGE_BUFFER = Buffer.from(
  '<svg xmlns="http://www.w3.org/2000/svg" width="40" height="30"><rect width="40" height="30" fill="red"/></svg>',
);

describe('sanitizeHotdogImage', () => {
  it('re-encodes an accepted image as WebP, capped at 1600px on the long edge', async () => {
    const pngImageBuffer = await createTestHotdogImageBuffer({
      format: 'png',
      widthPixels: 2000,
      heightPixels: 1000,
    });

    const sanitizedImageBuffer = await sanitizeHotdogImage(pngImageBuffer);

    await expect(sharp(sanitizedImageBuffer).metadata()).resolves.toMatchObject({
      format: 'webp',
      width: 1600,
      height: 800,
    });
  });

  it('still accepts a slightly truncated phone JPEG', async () => {
    const jpegImageBuffer = await createTestHotdogImageBuffer({
      widthPixels: 400,
      heightPixels: 300,
    });

    const sanitizedImageBuffer = await sanitizeHotdogImage(
      jpegImageBuffer.subarray(0, jpegImageBuffer.length - 64),
    );

    await expect(sharp(sanitizedImageBuffer).metadata()).resolves.toMatchObject({
      format: 'webp',
      width: 400,
    });
  });

  it('rejects formats sharp can decode but we do not accept, like SVG', async () => {
    await expect(sanitizeHotdogImage(SVG_IMAGE_BUFFER)).rejects.toMatchObject({
      httpStatusCode: 400,
    });
  });
});
