import 'server-only';

import { ExpectedServerError } from '@/shared/utils/error';
import sharp from 'sharp';

/** Long-edge cap for stored images; plenty for a detailed vision check and the detail view. */
const HOTDOG_IMAGE_MAX_EDGE_PIXELS = 1600;
const HOTDOG_IMAGE_WEBP_QUALITY = 85;
/** Decompression-bomb guard (~50 megapixels, above any phone camera). */
const HOTDOG_IMAGE_MAX_INPUT_PIXELS = 50_000_000;

/** sharp's names for the formats we accept; anything else (SVG, TIFF, HEIF, ...) is rejected. */
const ACCEPTED_DECODED_IMAGE_FORMAT_LIST = ['jpeg', 'png', 'gif', 'webp'];

/**
 * Every stored original (and the image the model sees) is WebP: one predictable format that
 * stays far below the bucket's size limit, whatever was uploaded (a 1600px PNG may not).
 */
export const SANITIZED_HOTDOG_IMAGE_MEDIA_TYPE = 'image/webp';

const createUnreadableImageError = () => new ExpectedServerError({ errorCode: 'IMAGE_UNREADABLE' });

/**
 * Decodes and re-encodes the image as WebP so no metadata survives (EXIF, GPS, XMP, ...):
 * applies the EXIF orientation, caps the long edge, and drops every other chunk.
 * Only the first frame of an animated image is kept (the vision model only reads one).
 * Decoding is also the real content check — a non-image, an unsupported format, or a broken
 * file fails here (400). Decoding is tolerant (`failOn: 'none'`) so slightly truncated phone
 * JPEGs still work — every stricter level rejects them; invalid metadata always aborts, and
 * the format allowlist plus the pixel limit still bound what gets decoded.
 */
export const sanitizeHotdogImage = async (imageBuffer: Buffer): Promise<Buffer> => {
  const decodedImage = sharp(imageBuffer, {
    failOn: 'none',
    limitInputPixels: HOTDOG_IMAGE_MAX_INPUT_PIXELS,
  });
  const { format: decodedImageFormat } = await decodedImage.metadata().catch(() => {
    throw createUnreadableImageError();
  });

  if (!ACCEPTED_DECODED_IMAGE_FORMAT_LIST.includes(decodedImageFormat)) {
    throw createUnreadableImageError();
  }

  try {
    return await decodedImage
      .rotate()
      .resize({
        width: HOTDOG_IMAGE_MAX_EDGE_PIXELS,
        height: HOTDOG_IMAGE_MAX_EDGE_PIXELS,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: HOTDOG_IMAGE_WEBP_QUALITY })
      .toBuffer();
  } catch {
    throw createUnreadableImageError();
  }
};
