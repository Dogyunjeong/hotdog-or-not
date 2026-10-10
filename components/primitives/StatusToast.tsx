'use client';

import { useEffect } from 'react';

import Button from './Button';

const STATUS_TOAST_DURATION_MS = 5000;

interface StatusToastProps {
  /** Changing the message (or its key) restarts the timer. */
  message: string;
  onDismiss: () => void;
}

/**
 * Short visual confirmation at the bottom of the screen; auto-dismisses.
 * Not a live region itself: screen readers often skip regions that mount already filled,
 * so the caller announces the same message through an always-mounted `role="status"` region.
 */
const StatusToast = ({ message, onDismiss }: StatusToastProps) => {
  useEffect(() => {
    const dismissTimeout = setTimeout(onDismiss, STATUS_TOAST_DURATION_MS);
    return () => clearTimeout(dismissTimeout);
  }, [message, onDismiss]);

  return (
    <div className="fixed inset-x-4 bottom-4 z-10 mx-auto flex items-center gap-3 rounded-card border border-border bg-surface py-2 pr-2 pl-4 text-foreground shadow-overlay motion-safe:animate-status-enter sm:w-max sm:max-w-md">
      <p className="flex-1 text-sm">{message}</p>
      <Button variant="secondary" size="icon" aria-label="Dismiss" onClick={onDismiss}>
        <span aria-hidden>×</span>
      </Button>
    </div>
  );
};

export default StatusToast;
