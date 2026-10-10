'use client';

import { type SyntheticEvent, useEffect, useRef } from 'react';

import Button from '@/components/primitives/Button';
import OnboardingStep from './OnboardingStep';

const ONBOARDING_STEP_LIST = [
  { title: 'Upload a photo', description: 'Pick any picture from your device.' },
  {
    title: 'Get a verdict',
    description: "We'll tell you if it's a hotdog, plus a quick reason why.",
  },
  {
    title: 'See your history',
    description: 'Your recent checks are saved in this browser so you can look back anytime.',
  },
];

interface OnboardingDialogProps {
  onComplete: () => void;
}

/**
 * Native modal `<dialog>`: focus trap, inert background, and top layer come for free.
 * Backdrop clicks do not close it; Esc or a browser-initiated close counts as "Got it".
 */
const OnboardingDialog = ({ onComplete }: OnboardingDialogProps) => {
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
            Welcome to Hotdog or Not Hotdog
          </h2>
          <p className="text-foreground-muted">It only takes a second. Here&apos;s how it works:</p>
        </div>
        <ol className="flex flex-col gap-4">
          {ONBOARDING_STEP_LIST.map((onboardingStep, onboardingStepIndex) => (
            <OnboardingStep
              key={onboardingStep.title}
              stepNumber={onboardingStepIndex + 1}
              title={onboardingStep.title}
              description={onboardingStep.description}
            />
          ))}
        </ol>
        <Button variant="primary" className="w-full" autoFocus onClick={completeOnboardingOnce}>
          Got it, let&apos;s go
        </Button>
      </div>
    </dialog>
  );
};

export default OnboardingDialog;
