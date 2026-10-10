import { describe, expect, it } from 'vitest';

import { hasHistoryConsent } from './historyConsent';

const requestWithConsentCookie = (cookieValue: string) =>
  new Request('http://localhost', { headers: { cookie: `a=b; cc_cookie=${cookieValue}` } });

describe('hasHistoryConsent', () => {
  it('is true only when the history category was accepted', () => {
    const acceptedCookie = encodeURIComponent(
      JSON.stringify({ categories: ['necessary', 'history'] }),
    );
    const rejectedCookie = encodeURIComponent(JSON.stringify({ categories: ['necessary'] }));

    expect(hasHistoryConsent(requestWithConsentCookie(acceptedCookie))).toBe(true);
    expect(hasHistoryConsent(requestWithConsentCookie(rejectedCookie))).toBe(false);
    expect(hasHistoryConsent(new Request('http://localhost'))).toBe(false);
    expect(hasHistoryConsent(requestWithConsentCookie('%E0%A4%A'))).toBe(false);
  });

  it('reads the categories from the full cookie the library writes', () => {
    const libraryCookie = encodeURIComponent(
      JSON.stringify({
        categories: ['necessary', 'history'],
        revision: 1,
        data: null,
        consentTimestamp: '2026-10-10T12:00:00.000Z',
        consentId: '5f1c7a8e-2b3d-4c5e-8f9a-0b1c2d3e4f5a',
        services: { necessary: [], history: [] },
        languageCode: 'en',
        lastConsentTimestamp: '2026-10-10T12:00:00.000Z',
        expirationTime: 1807099200000,
      }),
    );

    expect(hasHistoryConsent(requestWithConsentCookie(libraryCookie))).toBe(true);
  });
});
