'use client';

import { useTranslations } from 'next-intl';
import { type SyntheticEvent, useEffect, useRef } from 'react';

import Button from '@/components/primitives/Button';
import OnboardingStep from './OnboardingStep';

type OnboardingStepKey = 'upload' | 'scoop' | 'historyOn' | 'historyOff';

const getOnboardingStepKeyList = (isHistoryEnabled: boolean): OnboardingStepKey[] => {
  if (isHistoryEnabled) {
    return ['upload', 'scoop', 'historyOn'];
  }
  return ['upload', 'scoop', 'historyOff'];
};

interface OnboardingDialogProps {
  /** The last step explains history, or that nothing is saved for a guest. */
  isHistoryEnabled: boolean;
  onComplete: () => void;
}

/**
 * Native modal `<dialog>`: focus trap, inert background, and top layer come for free.
 * Backdrop clicks do not close it; Esc or a browser-initiated close counts as "Got it".
 */
const OnboardingDialog = ({ isHistoryEnabled, onComplete }: OnboardingDialogProps) => {
  const t = useTranslations('onboarding');
  const onboardingDialogRef = useRef<HTMLDialogElement>(null);
  // Esc can fire both `cancel` and `close`; complete (and POST) only once.
  const isOnboardingCompletedRef = useRef(false);

  useEffect(() => {
    const onboardingDialog = onboardingDialogRef.current;

    if (!onboardingDialog || onboardingDialog.open) {
      return;
    }
    onboardingDialog.showModal();
  }, []);

  const completeOnboardingOnce = () => {
    if (isOnboardingCompletedRef.current) {
      return;
    }
    isOnboardingCompletedRef.current = true;
    onComplete();
  };

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    // The parent unmounts the dialog, so keep the native close from running first.
    event.preventDefault();
    completeOnboardingOnce();
  };

  return (
    <dialog
      ref={onboardingDialogRef}
      aria-labelledby="onboarding-dialog-title"
      onCancel={handleCancel}
      onClose={completeOnboardingOnce}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-sm overflow-y-auto rounded-card bg-surface p-6 text-foreground shadow-overlay backdrop:bg-overlay-scrim motion-safe:animate-overlay-enter"
    >
      <div className="flex flex-col gap-6">
        <div className="space-y-2">
          <h2 id="onboarding-dialog-title" className="text-xl font-bold tracking-tight">
            {t('title')}
          </h2>
          <p className="text-foreground-muted">{t('intro')}</p>
        </div>
        <ol className="flex flex-col gap-4">
          {getOnboardingStepKeyList(isHistoryEnabled).map(
            (onboardingStepKey, onboardingStepIndex) => (
              <OnboardingStep
                key={onboardingStepKey}
                stepNumber={onboardingStepIndex + 1}
                title={t(`steps.${onboardingStepKey}.title`)}
                description={t(`steps.${onboardingStepKey}.description`)}
              />
            ),
          )}
        </ol>
        <Button variant="primary" className="w-full" autoFocus onClick={completeOnboardingOnce}>
          {t('confirmButton')}
        </Button>
      </div>
    </dialog>
  );
};

export default OnboardingDialog;
