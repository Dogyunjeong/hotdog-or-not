import { afterEach, describe, expect, it, vi } from 'vitest';

import { NominatimReverseGeocodingClient } from './ReverseGeocoding.client';

const gpsCoordinates = { latitude: 51.507912, longitude: -0.087731 };

const stubNominatimResponse = (response: Response) => {
  const fetchStub = vi.fn().mockResolvedValue(response);
  vi.stubGlobal('fetch', fetchStub);
  return fetchStub;
};

describe('NominatimReverseGeocodingClient', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('keeps only city, region and country, and sends coarse coordinates with a User-Agent', async () => {
    const fetchStub = stubNominatimResponse(
      Response.json({
        address: {
          road: 'King William Street',
          postcode: 'EC4N 7BP',
          city: 'London',
          state: 'England',
          country: 'United Kingdom',
        },
      }),
    );

    await expect(new NominatimReverseGeocodingClient().findPlaceName(gpsCoordinates)).resolves.toBe(
      'London, England, United Kingdom',
    );

    const [requestUrl, requestInit] = fetchStub.mock.calls[0];
    expect(requestUrl.searchParams.get('lat')).toBe('51.51');
    expect(requestUrl.searchParams.get('lon')).toBe('-0.09');
    expect(requestUrl.searchParams.get('zoom')).toBe('10');
    expect(requestInit.headers['User-Agent']).toMatch(/^HotdogOrNotHotdog\//);
  });

  it('returns undefined when there is no address and throws on HTTP errors', async () => {
    stubNominatimResponse(Response.json({ error: 'Unable to geocode' }));
    await expect(
      new NominatimReverseGeocodingClient().findPlaceName(gpsCoordinates),
    ).resolves.toBeUndefined();

    stubNominatimResponse(new Response(null, { status: 503 }));
    await expect(
      new NominatimReverseGeocodingClient().findPlaceName(gpsCoordinates),
    ).rejects.toThrow('status 503');
  });
});
