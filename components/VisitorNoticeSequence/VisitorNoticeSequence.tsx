'use client';

import { usePathname } from 'next/navigation';
import { useState } from 'react';

import OnboardingDialog from '@/components/Onboarding/OnboardingDialog';
import { useVisitorOnboarding } from '@/hooks/useVisitorOnboarding';

const ONBOARDING_PATHNAME = '/';

/**
 * First-visit notices, one at a time: the cookie banner first (rendered by the consent library
 * via `VisitorPrivacyProvider` — we must know whether we may save anything), then onboarding.
 * Onboarding waits until the banner is answered, so the two are never on screen together.
 */
const VisitorNoticeSequence = () => {
  const pathname = usePathname();
  // Decided once on the landing route: client navigation must not bring onboarding back.
  const [isOnboardingCheckNeeded] = useState(() => pathname === ONBOARDING_PATHNAME);
  const { visitorOnboardingStatus, isHistoryEnabled, completeOnboarding } = useVisitorOnboarding({
    isOnboardingCheckNeeded,
  });

  switch (visitorOnboardingStatus) {
    case 'required':
      return (
        <OnboardingDialog isHistoryEnabled={isHistoryEnabled} onComplete={completeOnboarding} />
      );
    case 'checking':
    case 'notRequired':
      return null;
  }
};

export default VisitorNoticeSequence;
