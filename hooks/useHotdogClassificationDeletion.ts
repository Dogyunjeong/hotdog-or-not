'use client';

import { ExpectedServerError } from '@/shared/utils/error';
import { useState } from 'react';

import { hotdogClassificationController } from '@/controllers/apiControllers';

export type HotdogClassificationDeletionState =
  | { status: 'idle' }
  | { status: 'confirming' | 'deleting' | 'failed'; hotdogClassificationId: string };

/** A 404 means the photo is already gone, which is what the visitor asked for. */
const isHotdogClassificationAlreadyDeleted = (error: unknown) => {
  return (
    error instanceof ExpectedServerError &&
    error.httpStatusCode === ExpectedServerError.HTTP_STATUS.NOT_FOUND
  );
};

/**
 * Delete one saved photo: confirm → delete → `onHotdogClassificationDeleted`.
 * A failure keeps the confirmation open so the visitor can retry in place.
 * Owned above the panel/drawer switch, so a resize mid-delete keeps the dialog and outcome.
 */
export const useHotdogClassificationDeletion = ({
  onHotdogClassificationDeleted,
}: {
  onHotdogClassificationDeleted: (deletedHotdogClassificationId: string) => void;
}) => {
  const [deletionState, setDeletionState] = useState<HotdogClassificationDeletionState>({
    status: 'idle',
  });

  const requestDeletion = (hotdogClassificationId: string) => {
    setDeletionState({ status: 'confirming', hotdogClassificationId });
  };

  const cancelDeletion = () => {
    setDeletionState({ status: 'idle' });
  };

  const confirmDeletion = async () => {
    if (deletionState.status === 'idle') {
      return;
    }

    const { hotdogClassificationId } = deletionState;
    setDeletionState({ status: 'deleting', hotdogClassificationId });

    try {
      await hotdogClassificationController.deleteClassification({ hotdogClassificationId });
    } catch (error) {
      if (!isHotdogClassificationAlreadyDeleted(error)) {
        setDeletionState({ status: 'failed', hotdogClassificationId });
        return;
      }
    }
    setDeletionState({ status: 'idle' });
    onHotdogClassificationDeleted(hotdogClassificationId);
  };

  return { deletionState, requestDeletion, cancelDeletion, confirmDeletion };
};
