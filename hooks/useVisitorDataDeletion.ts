'use client';

import { useState } from 'react';

import { visitorSessionController } from '@/controllers/apiControllers';

type VisitorDataDeletionStatus = 'idle' | 'pending' | 'failed';

/** Erasing everything saved for this visitor (photos, verdicts, session cookie). */
export const useVisitorDataDeletion = () => {
  const [visitorDataDeletionStatus, setVisitorDataDeletionStatus] =
    useState<VisitorDataDeletionStatus>('idle');

  /** Resolves `true` once erased; on failure the status is `failed` and it's safe to retry. */
  const eraseVisitorData = async (): Promise<boolean> => {
    setVisitorDataDeletionStatus('pending');

    try {
      await visitorSessionController.eraseVisitorData();
      setVisitorDataDeletionStatus('idle');
      return true;
    } catch {
      setVisitorDataDeletionStatus('failed');
      return false;
    }
  };

  const resetVisitorDataDeletion = () => {
    setVisitorDataDeletionStatus('idle');
  };

  return {
    isVisitorDataDeletionPending: visitorDataDeletionStatus === 'pending',
    isVisitorDataDeletionFailed: visitorDataDeletionStatus === 'failed',
    eraseVisitorData,
    resetVisitorDataDeletion,
  };
};
