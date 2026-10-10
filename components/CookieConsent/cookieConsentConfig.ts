import { getPathname } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { CookieConsentTypes } from '@/shared/types';
import type { useTranslations } from 'next-intl';
import type { CookieConsentConfig } from 'vanilla-cookieconsent';

type CookieConsentTranslator = ReturnType<typeof useTranslations<'cookieConsent'>>;

const { NECESSARY, HISTORY } = CookieConsentTypes.COOKIE_CONSENT_CATEGORY;

/**
 * `necessary` is only the consent cookie itself; `history` is the visitor session cookie
 * that saves photos and verdicts (the server reads the same ids from `cc_cookie`).
 * The banner blocks the page until answered (we must know whether we may save anything);
 * `CookieConsentNotice` sets `disablePageInteraction` and the callbacks.
 * The library only knows the page's language: switching language is a full page load, so a
 * single translation (the current locale's) is enough.
 */
export const createCookieConsentConfig = ({
  t,
  locale,
}: {
  t: CookieConsentTranslator;
  locale: AppLocale;
}): CookieConsentConfig => {
  // A full page load (library HTML, not next/link), so the path needs its locale prefix.
  const cookiePolicyHref = getPathname({ href: '/cookie-policy', locale });

  return {
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
      default: locale,
      translations: {
        [locale]: {
          consentModal: {
            title: t('consentModal.title'),
            description: `${t('consentModal.description')} <a href="${cookiePolicyHref}">${t('consentModal.cookiePolicyLink')}</a>`,
            acceptAllBtn: t('consentModal.acceptAllButton'),
            acceptNecessaryBtn: t('consentModal.rejectButton'),
          },
          preferencesModal: {
            title: t('preferencesModal.title'),
            acceptAllBtn: t('preferencesModal.acceptAllButton'),
            acceptNecessaryBtn: t('preferencesModal.rejectAllButton'),
            savePreferencesBtn: t('preferencesModal.saveButton'),
            closeIconLabel: t('preferencesModal.closeIconLabel'),
            sections: [
              {
                title: t('preferencesModal.essentialTitle'),
                description: t('preferencesModal.essentialDescription'),
                linkedCategory: NECESSARY,
              },
              {
                title: t('preferencesModal.historyTitle'),
                description: t('preferencesModal.historyDescription'),
                linkedCategory: HISTORY,
              },
              {
                title: t('preferencesModal.deleteTitle'),
                description: t('preferencesModal.deleteDescription'),
              },
            ],
          },
        },
      },
    },
  };
};
