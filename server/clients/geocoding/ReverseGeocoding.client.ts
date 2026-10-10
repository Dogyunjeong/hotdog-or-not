import 'server-only';

import { setTimeout as waitFor } from 'node:timers/promises';
import { z } from 'zod';

export interface GpsCoordinates {
  latitude: number;
  longitude: number;
}

/** Turns coordinates into a coarse place name. Implementations throw on any failure. */
export interface ReverseGeocodingClient {
  /** "City, Region, Country" (whatever parts are known), or `undefined` when there's no address. */
  findPlaceName: (gpsCoordinates: GpsCoordinates) => Promise<string | undefined>;
}

const NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
/**
 * Nominatim's usage policy requires an identifying User-Agent.
 * TODO: add a contact URL or email (e.g. "HotdogOrNotHotdog/0.3 (+https://…/contact)") before production.
 */
const NOMINATIM_USER_AGENT = 'HotdogOrNotHotdog/0.3';
/** City level; we never want street-level detail. */
const NOMINATIM_ZOOM_CITY = '10';
const NOMINATIM_REQUEST_TIMEOUT_MS = 3000;
/** Usage policy: at most 1 request per second. */
const NOMINATIM_MIN_REQUEST_INTERVAL_MS = 1000;
/** Past this queue wait we skip geocoding instead of slowing the classification down. */
const NOMINATIM_MAX_QUEUE_WAIT_MS = 2000;
/** ~1 km: enough for a city-level lookup, so the exact spot never leaves the server. */
const COORDINATE_DECIMAL_PLACES = 2;

const nominatimReverseResponseSchema = z.object({
  address: z
    .object({
      city: z.string(),
      town: z.string(),
      village: z.string(),
      state: z.string(),
      region: z.string(),
      country: z.string(),
    })
    .partial()
    .optional(),
});

type NominatimAddress = NonNullable<z.infer<typeof nominatimReverseResponseSchema>['address']>;

/** Only "city/town/village, state/region, country" — never streets, postcodes or coordinates. */
const toPlaceName = (nominatimAddress: NominatimAddress) => {
  const placeNamePartList = [
    nominatimAddress.city ?? nominatimAddress.town ?? nominatimAddress.village,
    nominatimAddress.state ?? nominatimAddress.region,
    nominatimAddress.country,
  ].filter((placeNamePart): placeNamePart is string => Boolean(placeNamePart?.trim()));
  // City-states repeat themselves ("Berlin, Berlin, Germany").
  const uniquePlaceNamePartList = [...new Set(placeNamePartList)];

  if (uniquePlaceNamePartList.length === 0) {
    return undefined;
  }
  return uniquePlaceNamePartList.join(', ');
};

/**
 * OpenStreetMap Nominatim reverse geocoding (https://operations.osmfoundation.org/policies/nominatim/).
 * The 1 req/s throttle is per server instance — good enough for this app's traffic.
 * TODO: cache place names by rounded coordinates to stay well inside the usage policy.
 */
export class NominatimReverseGeocodingClient implements ReverseGeocodingClient {
  private _nextRequestAvailableAt = 0;

  /** Reserves the next free 1-second slot, or throws when the queue is too long. */
  private _waitForRequestSlot = async () => {
    const now = Date.now();
    const requestStartsAt = Math.max(now, this._nextRequestAvailableAt);
    const queueWaitMs = requestStartsAt - now;

    if (queueWaitMs > NOMINATIM_MAX_QUEUE_WAIT_MS) {
      throw new Error('Reverse geocoding is busy');
    }

    this._nextRequestAvailableAt = requestStartsAt + NOMINATIM_MIN_REQUEST_INTERVAL_MS;
    await waitFor(queueWaitMs);
  };

  private _createReverseUrl = ({ latitude, longitude }: GpsCoordinates) => {
    const reverseUrl = new URL(NOMINATIM_REVERSE_URL);
    reverseUrl.search = new URLSearchParams({
      format: 'jsonv2',
      lat: latitude.toFixed(COORDINATE_DECIMAL_PLACES),
      lon: longitude.toFixed(COORDINATE_DECIMAL_PLACES),
      zoom: NOMINATIM_ZOOM_CITY,
      'accept-language': 'en',
    }).toString();
    return reverseUrl;
  };

  public findPlaceName = async (gpsCoordinates: GpsCoordinates) => {
    await this._waitForRequestSlot();
    const response = await fetch(this._createReverseUrl(gpsCoordinates), {
      headers: { 'User-Agent': NOMINATIM_USER_AGENT },
      signal: AbortSignal.timeout(NOMINATIM_REQUEST_TIMEOUT_MS),
    });

    if (!response.ok) {
      // Status only: the URL carries coordinates and must never reach logs.
      throw new Error(`Reverse geocoding failed with status ${response.status}`);
    }

    // Nominatim answers "no address here" (e.g. open sea) with `{ error }` and no `address`.
    const { address } = nominatimReverseResponseSchema.parse(await response.json());

    if (!address) {
      return undefined;
    }
    return toPlaceName(address);
  };
}

let reverseGeocodingClient: ReverseGeocodingClient | undefined;

export const getReverseGeocodingClient = (): ReverseGeocodingClient => {
  if (reverseGeocodingClient) {
    return reverseGeocodingClient;
  }

  reverseGeocodingClient = new NominatimReverseGeocodingClient();
  return reverseGeocodingClient;
};
