import { CookieConsentTypes } from '@/shared/types';
import type { CookieConsentConfig } from 'vanilla-cookieconsent';

const { NECESSARY, HISTORY } = CookieConsentTypes.COOKIE_CONSENT_CATEGORY;

/**
 * `necessary` is only the consent cookie itself; `history` is the visitor session cookie
 * that saves photos and verdicts (the server reads the same ids from `cc_cookie`).
 * The banner blocks the page until answered (we must know whether we may save anything);
 * `CookieConsentNotice` sets `disablePageInteraction` and the callbacks.
 */
export const cookieConsentConfig: CookieConsentConfig = {
  // 1 = the `history` category exists. Older choices (revision 0: one "necessary" category)
  // are no longer valid, so those visitors are asked again instead of silently becoming guests.
  revision: 1,
  categories: {
    [NECESSARY]: { enabled: true, readOnly: true },
    // The session cookie is httpOnly, so the library can't clear it; the erase API does.
    [HISTORY]: { enabled: false },
  },
  guiOptions: {
    // Equal size and position for Accept and Reject; the theme styles Reject as secondary.
    consentModal: { layout: 'box', position: 'bottom center', equalWeightButtons: true },
    preferencesModal: { layout: 'box', equalWeightButtons: true },
  },
  language: {
    default: 'en',
    translations: {
      en: {
        consentModal: {
          title: 'Save your hotdog history?',
          description:
            'We\'d like to set one cookie that keeps your photos and verdicts in this browser so you can look back later. Say no and everything still works — we just won\'t save anything. No tracking, no ads. <a href="/cookie-policy">Cookie policy</a>',
          acceptAllBtn: 'Accept',
          acceptNecessaryBtn: 'Reject',
        },
        preferencesModal: {
          title: 'Cookie settings',
          acceptAllBtn: 'Accept all',
          acceptNecessaryBtn: 'Reject all',
          savePreferencesBtn: 'Save choices',
          closeIconLabel: 'Close',
          sections: [
            {
              title: 'Essential',
              description: 'Remembers your cookie choice (cc_cookie). Always on.',
              linkedCategory: NECESSARY,
            },
            {
              title: 'History',
              description:
                "Keeps your photos and verdicts in this browser (hotdog_or_not_visitor_session). Turning it off erases everything we've saved.",
              linkedCategory: HISTORY,
            },
            {
              title: 'Want everything gone?',
              description: 'Use “Delete my data” at the bottom of the page anytime.',
            },
          ],
        },
      },
    },
  },
};
