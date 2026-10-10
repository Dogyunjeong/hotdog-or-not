'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useState } from 'react';

import CookieConsentNotice from '@/components/CookieConsent/CookieConsentNotice';
import OnboardingDialog from '@/components/Onboarding/OnboardingDialog';
import { type VisitorOnboardingStatus, useVisitorOnboarding } from '@/hooks/useVisitorOnboarding';

type VisitorNoticeStep = 'checking' | 'onboarding' | 'cookieNotice' | 'done';

const ONBOARDING_PATHNAME = '/';

const getVisitorNoticeStep = ({
  visitorOnboardingStatus,
  isCookieNoticeDone,
}: {
  visitorOnboardingStatus: VisitorOnboardingStatus;
  isCookieNoticeDone: boolean;
}): VisitorNoticeStep => {
  switch (visitorOnboardingStatus) {
    case 'checking':
      return 'checking';
    case 'required':
      return 'onboarding';
    case 'notRequired':
      return isCookieNoticeDone ? 'done' : 'cookieNotice';
  }
};

/**
 * The single owner of first-visit notices: onboarding (modal) first, then the cookie
 * banner, so the two are never on screen together.
 */
const VisitorNoticeSequence = () => {
  const pathname = usePathname();
  // Decided once on the landing route: client navigation must not bring onboarding back
  // on top of a cookie banner that is already showing.
  const [isOnboardingCheckNeeded] = useState(() => pathname === ONBOARDING_PATHNAME);
  const { visitorOnboardingStatus, completeOnboarding } = useVisitorOnboarding({
    isOnboardingCheckNeeded,
  });
  const [isCookieNoticeDone, setIsCookieNoticeDone] = useState(false);

  const markCookieNoticeDone = useCallback(() => {
    setIsCookieNoticeDone(true);
  }, []);

  const visitorNoticeStep = getVisitorNoticeStep({ visitorOnboardingStatus, isCookieNoticeDone });

  switch (visitorNoticeStep) {
    case 'onboarding':
      return <OnboardingDialog onComplete={completeOnboarding} />;
    case 'cookieNotice':
      return <CookieConsentNotice onDone={markCookieNoticeDone} />;
    case 'checking':
    case 'done':
      return null;
  }
};

export default VisitorNoticeSequence;
