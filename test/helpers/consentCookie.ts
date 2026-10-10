import { CookieConsentTypes } from '@/shared/types';

/** The `cc_cookie` pair vanilla-cookieconsent writes (URI-encoded JSON with the accepted categories). */
const createConsentCookie = (categoryList: string[]) => {
  return `${CookieConsentTypes.COOKIE_CONSENT_COOKIE_NAME}=${encodeURIComponent(
    JSON.stringify({ categories: categoryList }),
  )}`;
};

/** "Accept": history is saved. */
export const HISTORY_CONSENT_COOKIE = createConsentCookie([
  CookieConsentTypes.COOKIE_CONSENT_CATEGORY.NECESSARY,
  CookieConsentTypes.COOKIE_CONSENT_CATEGORY.HISTORY,
]);

/** "Reject": guest mode. */
export const NECESSARY_ONLY_CONSENT_COOKIE = createConsentCookie([
  CookieConsentTypes.COOKIE_CONSENT_CATEGORY.NECESSARY,
]);
