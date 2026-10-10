'use client';

import { useEffect, useState } from 'react';

import { visitorSessionController } from '@/controllers/apiControllers';

export type VisitorOnboardingStatus = 'checking' | 'required' | 'notRequired';

const fetchVisitorOnboardingStatus = async (): Promise<VisitorOnboardingStatus> => {
  try {
    const { isOnboardingCompleted } = await visitorSessionController.getCurrentVisitorSession();

    if (isOnboardingCompleted) {
      return 'notRequired';
    }
    return 'required';
  } catch {
    // Skip onboarding for this visit; it shows again on the next one.
    return 'notRequired';
  }
};

/**
 * Whether this visitor still needs onboarding, saved server-side per visitor session.
 * Once `notRequired`, the status never goes back — the notice sequence relies on that.
 */
export const useVisitorOnboarding = ({
  isOnboardingCheckNeeded,
}: {
  isOnboardingCheckNeeded: boolean;
}) => {
  const [visitorOnboardingStatus, setVisitorOnboardingStatus] = useState<VisitorOnboardingStatus>(
    isOnboardingCheckNeeded ? 'checking' : 'notRequired',
  );

  useEffect(() => {
    if (!isOnboardingCheckNeeded) {
      return;
    }

    let isEffectActive = true;
    fetchVisitorOnboardingStatus().then((fetchedVisitorOnboardingStatus) => {
      if (!isEffectActive) {
        return;
      }
      setVisitorOnboardingStatus(fetchedVisitorOnboardingStatus);
    });
    return () => {
      isEffectActive = false;
    };
  }, [isOnboardingCheckNeeded]);

  /** Closes right away; a failed save only means onboarding shows again next visit. */
  const completeOnboarding = () => {
    setVisitorOnboardingStatus('notRequired');
    visitorSessionController.completeOnboarding().catch(() => undefined);
  };

  return { visitorOnboardingStatus, completeOnboarding };
};
