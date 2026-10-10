import 'server-only';

import exifr from 'exifr';

import type { GpsCoordinates } from '@/server/clients/geocoding/ReverseGeocoding.client';

const isValidGpsCoordinates = ({ latitude, longitude }: GpsCoordinates) => {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180
  );
};

/**
 * The photo's EXIF GPS position, read in memory only — never stored, logged, or returned.
 * `undefined` when there is none or the metadata can't be read (e.g. GIF): the location is
 * a nice-to-have and must never fail the classification.
 */
export const readHotdogImageGpsCoordinates = async (
  imageBuffer: Buffer,
): Promise<GpsCoordinates | undefined> => {
  // `exifr.gps` resolves `undefined` for images without GPS despite its typings.
  const gpsCoordinates: GpsCoordinates | undefined = await exifr
    .gps(imageBuffer)
    .catch(() => undefined);

  if (!gpsCoordinates || !isValidGpsCoordinates(gpsCoordinates)) {
    return undefined;
  }
  return { latitude: gpsCoordinates.latitude, longitude: gpsCoordinates.longitude };
};
