import { vi } from 'vitest';

import type { ReverseGeocodingClient } from '@/server/clients/geocoding/ReverseGeocoding.client';

/** Fakes `findPlaceName` with a fixed place name (or a rejection, like a timeout). */
export const createFakeReverseGeocodingClient = ({
  placeName,
  findPlaceNameError,
}: { placeName?: string; findPlaceNameError?: Error } = {}) => {
  const findPlaceName = findPlaceNameError
    ? vi.fn().mockRejectedValue(findPlaceNameError)
    : vi.fn().mockResolvedValue(placeName);
  const reverseGeocodingClient: ReverseGeocodingClient = { findPlaceName };
  return { reverseGeocodingClient, findPlaceName };
};
