import sharp from 'sharp';

import type { GpsCoordinates } from '@/server/clients/geocoding/ReverseGeocoding.client';

type TestImageFormat = 'jpeg' | 'png';

/** EXIF stores GPS as unsigned "degrees minutes seconds" rationals plus an N/S or E/W ref. */
const toExifGpsRational = (decimalDegrees: number) => {
  const absoluteDegrees = Math.abs(decimalDegrees);
  const degrees = Math.floor(absoluteDegrees);
  const minutes = Math.floor((absoluteDegrees - degrees) * 60);
  const secondsTimes100 = Math.round(((absoluteDegrees - degrees) * 60 - minutes) * 60 * 100);
  return `${degrees}/1 ${minutes}/1 ${secondsTimes100}/100`;
};

const toExifGpsTags = ({ latitude, longitude }: GpsCoordinates) => ({
  GPSLatitudeRef: latitude >= 0 ? 'N' : 'S',
  GPSLatitude: toExifGpsRational(latitude),
  GPSLongitudeRef: longitude >= 0 ? 'E' : 'W',
  GPSLongitude: toExifGpsRational(longitude),
});

/** A real, decodable image — optionally a camera-like JPEG with EXIF GPS (IFD3). */
export const createTestHotdogImageBuffer = async ({
  format = 'jpeg',
  widthPixels = 64,
  heightPixels = 48,
  gpsCoordinates,
}: {
  format?: TestImageFormat;
  widthPixels?: number;
  heightPixels?: number;
  gpsCoordinates?: GpsCoordinates;
} = {}): Promise<Buffer> => {
  const blankImage = sharp({
    create: { width: widthPixels, height: heightPixels, channels: 3, background: '#c2410c' },
  }).toFormat(format);

  if (!gpsCoordinates) {
    return blankImage.toBuffer();
  }
  return blankImage
    .withExif({ IFD0: { Make: 'TestCamera' }, IFD3: toExifGpsTags(gpsCoordinates) })
    .toBuffer();
};
