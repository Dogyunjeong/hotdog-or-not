'use client';

import { type ReactNode, type SyntheticEvent, useId } from 'react';

import Button from './Button';
import InlineAlert from './InlineAlert';
import { useModalDialog } from './useModalDialog';

type ConfirmDialogTone = 'danger' | 'neutral';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  description: ReactNode;
  /** Omit for an info dialog with a single (cancel) button. */
  confirmLabel?: string;
  pendingConfirmLabel?: string;
  cancelLabel: string;
  isPending?: boolean;
  /** Shown above the buttons; the confirm button then reads "Try again". */
  errorMessage?: string;
  tone?: ConfirmDialogTone;
  onConfirm?: () => void;
  onCancel: () => void;
}

const RETRY_CONFIRM_LABEL = 'Try again';

const getConfirmLabel = ({
  confirmLabel,
  pendingConfirmLabel,
  isPending,
  errorMessage,
}: Pick<
  ConfirmDialogProps,
  'confirmLabel' | 'pendingConfirmLabel' | 'isPending' | 'errorMessage'
>) => {
  if (isPending && pendingConfirmLabel) {
    return pendingConfirmLabel;
  }

  if (errorMessage) {
    return RETRY_CONFIRM_LABEL;
  }
  return confirmLabel;
};

/**
 * Modal confirm/info dialog (native `<dialog>`, role="alertdialog").
 * Initial focus is on Cancel; Esc cancels except while the action is pending;
 * backdrop clicks never close it.
 */
const ConfirmDialog = ({
  isOpen,
  title,
  description,
  confirmLabel,
  pendingConfirmLabel,
  cancelLabel,
  isPending = false,
  errorMessage,
  tone = 'danger',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  // A browser-forced close (repeated Esc) keeps the dialog open while the action is pending,
  // otherwise counts as a cancel.
  const dialogRef = useModalDialog(isOpen, {
    onNativeClose: onCancel,
    shouldReopenOnNativeClose: isPending,
  });
  const titleId = useId();
  const descriptionId = useId();
  const hasConfirmAction = Boolean(confirmLabel && onConfirm);

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    // The parent owns `isOpen`; never let the browser close the dialog on its own.
    event.preventDefault();
    // React would otherwise also run every ancestor dialog's `onCancel` (e.g. the drawer).
    event.stopPropagation();

    if (isPending) {
      return;
    }
    onCancel();
  };

  return (
    <dialog
      ref={dialogRef}
      role="alertdialog"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={handleCancel}
      className="m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-card bg-surface p-6 text-foreground shadow-overlay backdrop:bg-overlay-scrim motion-safe:animate-overlay-enter"
    >
      {isOpen && (
        <div className="flex flex-col gap-5">
          <h2 id={titleId} className="text-xl font-bold tracking-tight">
            {title}
          </h2>
          <div id={descriptionId} className="flex flex-col gap-3 text-foreground-muted">
            {description}
          </div>
          {errorMessage && <InlineAlert message={errorMessage} />}
          {/* Cancel must stay FIRST in DOM order: showModal() focuses the first focusable
              element, which is how the dialog opens with focus on Cancel. */}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              variant="secondary"
              disabled={isPending}
              onClick={onCancel}
              className="w-full sm:w-auto"
            >
              {cancelLabel}
            </Button>
            {hasConfirmAction && (
              <Button
                variant={tone === 'danger' ? 'danger' : 'primary'}
                disabled={isPending}
                aria-busy={isPending || undefined}
                onClick={onConfirm}
                className="w-full sm:w-auto"
              >
                {getConfirmLabel({ confirmLabel, pendingConfirmLabel, isPending, errorMessage })}
              </Button>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
};

export default ConfirmDialog;
