'use client';

import 'vanilla-cookieconsent/dist/cookieconsent.css';
import './cookieConsentTheme.css';

import { useEffect } from 'react';
import * as CookieConsent from 'vanilla-cookieconsent';

import { cookieConsentConfig } from './cookieConsentConfig';

interface CookieConsentNoticeProps {
  onDone: () => void;
}

/** Shows the cookie banner (rendered by vanilla-cookieconsent) until the visitor accepts. */
const CookieConsentNotice = ({ onDone }: CookieConsentNoticeProps) => {
  useEffect(() => {
    const runCookieConsent = async () => {
      await CookieConsent.run({ ...cookieConsentConfig, onFirstConsent: onDone });

      if (CookieConsent.validConsent()) {
        onDone();
      }
    };
    void runCookieConsent();
  }, [onDone]);

  return null;
};

export default CookieConsentNotice;
