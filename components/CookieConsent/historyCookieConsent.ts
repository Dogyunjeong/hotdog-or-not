import { CookieConsentTypes } from '@/shared/types';
import * as CookieConsent from 'vanilla-cookieconsent';

const { HISTORY } = CookieConsentTypes.COOKIE_CONSENT_CATEGORY;

export type HistoryConsentDecision = 'accepted' | 'rejected';

export const getHistoryConsentDecision = (
  acceptedCategoryList: string[],
): HistoryConsentDecision => {
  if (acceptedCategoryList.includes(HISTORY)) {
    return 'accepted';
  }
  return 'rejected';
};

export const isHistoryConsentAccepted = () => CookieConsent.acceptedCategory(HISTORY);

/** Adds `history` to the visitor's choices (fires the library's `onChange`). */
export const acceptHistoryConsent = () => {
  const { acceptedCategories } = CookieConsent.getUserPreferences();
  CookieConsent.acceptCategory([...new Set([...acceptedCategories, HISTORY])]);
  // Accepting from our own UI answers the banner too; it must not linger.
  CookieConsent.hide();
};

/** Removes `history` from the visitor's choices (fires the library's `onChange`). */
export const rejectHistoryConsent = () => {
  const { acceptedCategories } = CookieConsent.getUserPreferences();
  CookieConsent.acceptCategory(
    acceptedCategories.filter((acceptedCategory) => acceptedCategory !== HISTORY),
  );
};

export const showCookieConsentPreferences = () => CookieConsent.showPreferences();
