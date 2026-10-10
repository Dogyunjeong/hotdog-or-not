import 'server-only';

import { CookieConsentTypes } from '@/shared/types';

import { readRequestCookie } from './readRequestCookie';

/**
 * Shape of the JSON vanilla-cookieconsent stores in its cookie (only what we read).
 * The library's `revision` and expiry are deliberately ignored here: on a revision change the
 * client asks again and rewrites the cookie, and the browser drops it once it expires.
 */
interface CookieConsentCookieValue {
  categories?: unknown;
}

const parseCookieConsentCookieValue = (
  rawCookieValue: string,
): CookieConsentCookieValue | undefined => {
  try {
    return JSON.parse(decodeURIComponent(rawCookieValue)) as CookieConsentCookieValue;
  } catch {
    // Malformed consent cookie: treat as "no consent" rather than failing the request.
    return undefined;
  }
};

/**
 * Whether the visitor accepted the `history` cookie category. Without it we must not set
 * the session cookie or save anything (guest mode). Used by `proxy.ts` and API handlers.
 */
export const hasHistoryConsent = (request: Request): boolean => {
  const rawCookieValue = readRequestCookie(request, CookieConsentTypes.COOKIE_CONSENT_COOKIE_NAME);

  if (!rawCookieValue) {
    return false;
  }

  const categoryList = parseCookieConsentCookieValue(rawCookieValue)?.categories;
  return (
    Array.isArray(categoryList) &&
    categoryList.includes(CookieConsentTypes.COOKIE_CONSENT_CATEGORY.HISTORY)
  );
};
