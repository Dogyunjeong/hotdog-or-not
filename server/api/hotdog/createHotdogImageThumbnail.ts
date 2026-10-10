import 'server-only';

import sharp from 'sharp';

/** Long-edge cap for list thumbnails (~2x the largest thumbnail on screen). */
const HOTDOG_IMAGE_THUMBNAIL_MAX_EDGE_PIXELS = 320;
const HOTDOG_IMAGE_THUMBNAIL_WEBP_QUALITY = 70;

export const HOTDOG_IMAGE_THUMBNAIL_MEDIA_TYPE = 'image/webp';

/**
 * Small WebP preview of an already sanitized image. Re-encoding keeps no metadata
 * (sharp strips it unless asked to keep it).
 */
export const createHotdogImageThumbnail = (sanitizedImageBuffer: Buffer): Promise<Buffer> => {
  return sharp(sanitizedImageBuffer)
    .resize({
      width: HOTDOG_IMAGE_THUMBNAIL_MAX_EDGE_PIXELS,
      height: HOTDOG_IMAGE_THUMBNAIL_MAX_EDGE_PIXELS,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: HOTDOG_IMAGE_THUMBNAIL_WEBP_QUALITY })
    .toBuffer();
};
