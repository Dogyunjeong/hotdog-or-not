'use client';

import ConfirmDialog from '@/components/primitives/ConfirmDialog';
import { useVisitorDataDeletion } from '@/hooks/useVisitorDataDeletion';

const ERASED_ITEM_LIST = [
  'All your uploaded photos',
  'All your verdicts and details',
  'Your history session cookie',
];

interface DeleteAllDataDialogProps {
  isOpen: boolean;
  isHistoryEnabled: boolean;
  onErased: () => void;
  onClose: () => void;
}

const HistoryEnabledDeleteAllDataDescription = () => {
  return (
    <>
      <p>This permanently erases everything we&apos;ve saved for this browser:</p>
      <ul className="list-disc space-y-1 pl-5">
        {ERASED_ITEM_LIST.map((erasedItem) => (
          <li key={erasedItem}>{erasedItem}</li>
        ))}
      </ul>
      <p>Your cookie choice stays, so we won&apos;t ask again. This can&apos;t be undone.</p>
    </>
  );
};

/**
 * Guests aren't saving anything now, but may still have data from before (e.g. history was
 * turned off without confirming the erase) — the same erase removes it, or does nothing.
 */
const GuestDeleteAllDataDescription = () => {
  return (
    <p>
      History is off, so we aren&apos;t saving anything right now. If you saved photos in this
      browser before, this permanently erases them.
    </p>
  );
};

/** "Delete my data" (footer and history panel). */
const DeleteAllDataDialog = ({
  isOpen,
  isHistoryEnabled,
  onErased,
  onClose,
}: DeleteAllDataDialogProps) => {
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
    onClose();
  };

  return (
    <ConfirmDialog
      isOpen={isOpen}
      title="Delete all your data?"
      description={
        isHistoryEnabled ? (
          <HistoryEnabledDeleteAllDataDescription />
        ) : (
          <GuestDeleteAllDataDescription />
        )
      }
      confirmLabel="Delete everything"
      pendingConfirmLabel="Deleting…"
      // "Keep my data" would imply we hold data for a guest.
      cancelLabel={isHistoryEnabled ? 'Keep my data' : 'Cancel'}
      isPending={isVisitorDataDeletionPending}
      errorMessage={
        isVisitorDataDeletionFailed
          ? "We couldn't delete your data. Nothing was removed, so it's safe to try again."
          : undefined
      }
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );
};

export default DeleteAllDataDialog;
