'use client';

import 'vanilla-cookieconsent/dist/cookieconsent.css';
import './cookieConsentTheme.css';

import { CookieConsentTypes } from '@/shared/types';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useEffectEvent, useState } from 'react';
import * as CookieConsent from 'vanilla-cookieconsent';

import { usePathname } from '@/i18n/navigation';
import { createCookieConsentConfig } from './cookieConsentConfig';
import { getHistoryConsentDecision, type HistoryConsentDecision } from './historyCookieConsent';

/** The banner links here, so the policy must stay readable (scrollable) while it's open. */
const COOKIE_POLICY_PATHNAME = '/cookie-policy';

interface CookieConsentNoticeProps {
  /** A choice saved on an earlier visit, read on page load. */
  onSavedDecisionRead: (historyConsentDecision: HistoryConsentDecision) => void;
  /** The visitor answered the banner (first choice). */
  onBannerAnswered: (historyConsentDecision: HistoryConsentDecision) => void;
  /** `history` was turned on or off later (Cookie settings, or our own `acceptCategory`). */
  onHistoryConsentChanged: (historyConsentDecision: HistoryConsentDecision) => void;
}

/**
 * Runs vanilla-cookieconsent once per page load, in the page's language; the library renders the banner (until it is
 * answered) and the Cookie settings modal, and reports the visitor's `history` choice.
 */
const CookieConsentNotice = ({
  onSavedDecisionRead,
  onBannerAnswered,
  onHistoryConsentChanged,
}: CookieConsentNoticeProps) => {
  const handleSavedDecisionRead = useEffectEvent(onSavedDecisionRead);
  const handleBannerAnswered = useEffectEvent(onBannerAnswered);
  const handleHistoryConsentChanged = useEffectEvent(onHistoryConsentChanged);
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations('cookieConsent');
  const getCookieConsentConfig = useEffectEvent(() => createCookieConsentConfig({ t, locale }));
  // The library reads this once, in `run()`, so it's decided by the landing page: the banner's
  // policy link is a full page load, but a later client navigation keeps the first choice.
  const [isPageInteractionDisabled] = useState(() => pathname !== COOKIE_POLICY_PATHNAME);

  useEffect(() => {
    // The library fires `onFirstConsent` then `onConsent` for a banner answer, but only
    // `onConsent` for a saved choice — remember which one we are in.
    let isBannerAnswered = false;

    void CookieConsent.run({
      ...getCookieConsentConfig(),
      disablePageInteraction: isPageInteractionDisabled,
      onFirstConsent: ({ cookie }) => {
        isBannerAnswered = true;
        handleBannerAnswered(getHistoryConsentDecision(cookie.categories));
      },
      onConsent: ({ cookie }) => {
        if (isBannerAnswered) {
          return;
        }
        handleSavedDecisionRead(getHistoryConsentDecision(cookie.categories));
      },
      onChange: ({ cookie, changedCategories }) => {
        if (!changedCategories.includes(CookieConsentTypes.COOKIE_CONSENT_CATEGORY.HISTORY)) {
          return;
        }
        handleHistoryConsentChanged(getHistoryConsentDecision(cookie.categories));
      },
    });
    // Runs once (the library ignores later `run()` calls and keeps its state for the page load).
  }, [isPageInteractionDisabled]);

  return null;
};

export default CookieConsentNotice;
