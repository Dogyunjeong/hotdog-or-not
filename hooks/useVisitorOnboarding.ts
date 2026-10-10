'use client';

import { useEffect, useState } from 'react';

import { visitorSessionController } from '@/controllers/apiControllers';
import { useVisitorPrivacy } from './useVisitorPrivacy';

type VisitorOnboardingStatus = 'checking' | 'required' | 'notRequired';

/** Result of asking the visitor's session (history on) whether onboarding was completed. */
type SavedOnboardingCheckResult = 'unchecked' | 'required' | 'notRequired';

const fetchSavedOnboardingCheckResult = async (): Promise<SavedOnboardingCheckResult> => {
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

const getVisitorOnboardingStatus = ({
  isOnboardingCheckNeeded,
  isOnboardingDismissed,
  isVisitorDataReset,
  savedOnboardingCheckResult,
  isGuest,
}: {
  isOnboardingCheckNeeded: boolean;
  isOnboardingDismissed: boolean;
  isVisitorDataReset: boolean;
  savedOnboardingCheckResult: SavedOnboardingCheckResult;
  isGuest: boolean;
}): VisitorOnboardingStatus => {
  // After an erase the session is fresh, but this visit has already seen the app.
  if (!isOnboardingCheckNeeded || isOnboardingDismissed || isVisitorDataReset) {
    return 'notRequired';
  }

  // Once the saved check answered, a later consent change can't bring onboarding back.
  if (savedOnboardingCheckResult !== 'unchecked') {
    return savedOnboardingCheckResult;
  }

  if (isGuest) {
    return 'required';
  }
  return 'checking';
};

/**
 * Whether this visitor still needs onboarding — decided only after the cookie banner is
 * answered. History on: saved per visitor session. Guest: nothing may be stored, so it shows
 * once per page load (kept in memory). Once `notRequired`, the status never goes back.
 */
export const useVisitorOnboarding = ({
  isOnboardingCheckNeeded,
}: {
  isOnboardingCheckNeeded: boolean;
}) => {
  const { historyConsentStatus, dataResetCount } = useVisitorPrivacy();
  const [savedOnboardingCheckResult, setSavedOnboardingCheckResult] =
    useState<SavedOnboardingCheckResult>('unchecked');
  const [isOnboardingDismissed, setIsOnboardingDismissed] = useState(false);
  const isHistoryEnabled = historyConsentStatus === 'enabled';

  const visitorOnboardingStatus = getVisitorOnboardingStatus({
    isOnboardingCheckNeeded,
    isOnboardingDismissed,
    isVisitorDataReset: dataResetCount > 0,
    savedOnboardingCheckResult,
    isGuest: historyConsentStatus === 'disabled',
  });
  const isSavedOnboardingCheckNeeded = visitorOnboardingStatus === 'checking' && isHistoryEnabled;

  useEffect(() => {
    if (!isSavedOnboardingCheckNeeded) {
      return;
    }

    let isEffectActive = true;
    fetchSavedOnboardingCheckResult().then((fetchedSavedOnboardingCheckResult) => {
      if (!isEffectActive) {
        return;
      }
      setSavedOnboardingCheckResult(fetchedSavedOnboardingCheckResult);
    });
    return () => {
      isEffectActive = false;
    };
  }, [isSavedOnboardingCheckNeeded]);

  /** Closes right away; a failed save only means onboarding shows again next visit. */
  const completeOnboarding = () => {
    setIsOnboardingDismissed(true);

    if (!isHistoryEnabled) {
      return;
    }
    visitorSessionController.completeOnboarding().catch(() => undefined);
  };

  return { visitorOnboardingStatus, isHistoryEnabled, completeOnboarding };
};
