'use client';

import type { HotdogClassificationDeletionState } from '@/hooks/useHotdogClassificationDeletion';

import ConfirmDialog from '@/components/primitives/ConfirmDialog';

interface HotdogClassificationDeletionDialogProps {
  deletionState: HotdogClassificationDeletionState;
  onConfirm: () => void;
  onCancel: () => void;
}

const HotdogClassificationDeletionDialog = ({
  deletionState,
  onConfirm,
  onCancel,
}: HotdogClassificationDeletionDialogProps) => {
  return (
    <ConfirmDialog
      isOpen={deletionState.status !== 'idle'}
      title="Delete this photo?"
      description={
        <p>The photo and its verdict will be permanently erased. This can&apos;t be undone.</p>
      }
      confirmLabel="Delete"
      pendingConfirmLabel="Deleting…"
      cancelLabel="Cancel"
      isPending={deletionState.status === 'deleting'}
      errorMessage={
        deletionState.status === 'failed'
          ? "We couldn't delete this photo. Nothing was removed — try again."
          : undefined
      }
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  );
};

export default HotdogClassificationDeletionDialog;
