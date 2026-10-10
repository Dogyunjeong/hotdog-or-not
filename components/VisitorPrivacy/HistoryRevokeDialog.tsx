'use client';

import ConfirmDialog from '@/components/primitives/ConfirmDialog';
import { useVisitorDataDeletion } from '@/hooks/useVisitorDataDeletion';

interface HistoryRevokeDialogProps {
  isOpen: boolean;
  onErased: () => void;
  /** Cancel (also after a failed erase): history stays on. */
  onKeepHistory: () => void;
}

/** Shown after history was turned off in Cookie settings: turning it off erases the data. */
const HistoryRevokeDialog = ({ isOpen, onErased, onKeepHistory }: HistoryRevokeDialogProps) => {
  const {
    isVisitorDataDeletionPending,
    isVisitorDataDeletionFailed,
    eraseVisitorData,
    resetVisitorDataDeletion,
  } = useVisitorDataDeletion();

  const handleConfirm = async () => {
    const isErased = await eraseVisitorData();

    if (!isErased) {
      return;
    }
    onErased();
  };

  const handleCancel = () => {
    resetVisitorDataDeletion();
    onKeepHistory();
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Turn off history?"
      description={
        <p>
          Turning off history erases everything we&apos;ve saved for this browser — all your photos,
          verdicts and your history session. This can&apos;t be undone.
        </p>
      }
      confirmLabel="Turn off and erase"
      pendingConfirmLabel="Erasing…"
      cancelLabel="Keep history on"
      isPending={isVisitorDataDeletionPending}
      errorMessage={
        isVisitorDataDeletionFailed
          ? "We couldn't erase your data, so history is still on. Try again."
          : undefined
      }
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
};

export default HistoryRevokeDialog;
