'use client';

import { useEffect, useRef } from 'react';

import TextButton from '@/components/primitives/TextButton';
import { type HistoryConsentStatus, useVisitorPrivacy } from '@/hooks/useVisitorPrivacy';

const GUEST_RESULT_MESSAGE = "History is off, so this result won't be saved.";

const getGuestResultNoteCopy = ({
  historyConsentStatus,
  isEnableHistoryFailed,
}: {
  historyConsentStatus: HistoryConsentStatus;
  isEnableHistoryFailed: boolean;
}) => {
  if (historyConsentStatus === 'enabling') {
    return { message: GUEST_RESULT_MESSAGE, actionLabel: 'Turning on…' };
  }

  if (isEnableHistoryFailed) {
    return { message: "We couldn't turn on history right now.", actionLabel: 'Try again' };
  }
  return { message: GUEST_RESULT_MESSAGE, actionLabel: 'Turn on history' };
};

interface GuestResultNoteActionProps {
  historyConsentStatus: HistoryConsentStatus;
  isEnableHistoryFailed: boolean;
  enableHistory: () => void;
}

/** `aria-disabled` (not `disabled`) while enabling, so the focused button keeps focus. */
const GuestResultNoteAction = ({
  historyConsentStatus,
  isEnableHistoryFailed,
  enableHistory,
}: GuestResultNoteActionProps) => {
  const isEnablingHistory = historyConsentStatus === 'enabling';
  const { message, actionLabel } = getGuestResultNoteCopy({
    historyConsentStatus,
    isEnableHistoryFailed,
  });

  const handleEnableHistoryClick = () => {
    if (isEnablingHistory) {
      return;
    }
    enableHistory();
  };

  return (
    <>
      <p>{message}</p>
      <TextButton
        variant="standalone"
        aria-disabled={isEnablingHistory}
        onClick={handleEnableHistoryClick}
        className={isEnablingHistory ? 'cursor-not-allowed opacity-50' : ''}
      >
        {actionLabel}
      </TextButton>
    </>
  );
};

/**
 * Under a guest's result (`id: null`). Turning history on doesn't save this result
 * retroactively — only the next checks. One stable root: when the button goes away after
 * history turns on, focus moves to the note instead of getting lost.
 */
const GuestResultNote = () => {
  const { historyConsentStatus, isEnableHistoryFailed, enableHistory } = useVisitorPrivacy();
  const guestResultNoteRef = useRef<HTMLDivElement>(null);
  const isHistoryEnabled = historyConsentStatus === 'enabled';

  useEffect(() => {
    if (!isHistoryEnabled || document.activeElement !== document.body) {
      return;
    }
    guestResultNoteRef.current?.focus();
  }, [isHistoryEnabled]);

  return (
    <div
      ref={guestResultNoteRef}
      tabIndex={-1}
      className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 rounded-card bg-accent-soft p-3 text-sm text-accent-soft-foreground outline-none"
    >
      {isHistoryEnabled && (
        <p>History is on now. This result wasn&apos;t saved, but your next checks will be.</p>
      )}
      {!isHistoryEnabled && (
        <GuestResultNoteAction
          historyConsentStatus={historyConsentStatus}
          isEnableHistoryFailed={isEnableHistoryFailed}
          enableHistory={enableHistory}
        />
      )}
    </div>
  );
};

export default GuestResultNote;
