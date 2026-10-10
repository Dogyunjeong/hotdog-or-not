import type { CookieConsentConfig } from 'vanilla-cookieconsent';

/**
 * Only strictly necessary cookies exist (the visitor session and this consent cookie),
 * so the banner informs rather than asks — there is nothing to reject.
 */
export const cookieConsentConfig: CookieConsentConfig = {
  categories: {
    necessary: { enabled: true, readOnly: true },
  },
  guiOptions: {
    consentModal: { layout: 'box', position: 'bottom right' },
    preferencesModal: { layout: 'box' },
  },
  language: {
    default: 'en',
    translations: {
      en: {
        consentModal: {
          title: 'Just the essentials',
          description:
            'We only use essential cookies: one keeps your history in this browser and one remembers this choice. No tracking, no ads. <a href="/cookie-policy">Read our cookie policy</a>',
          acceptAllBtn: 'Got it',
        },
        preferencesModal: {
          title: 'Cookie preferences',
          acceptAllBtn: 'Save',
          closeIconLabel: 'Close',
          sections: [
            {
              title: 'Essential cookies',
              description:
                "These keep the app working: one remembers your history in this browser, and one remembers your cookie choice. They can't be turned off.",
              linkedCategory: 'necessary',
            },
          ],
        },
      },
    },
  },
};
