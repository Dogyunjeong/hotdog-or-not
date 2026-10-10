'use client';

import type { HotdogTypes } from '@/shared/types';
import { getHotdogImageValidationErrorMessage } from '@/shared/utils/hotdog';
import { useEffect, useRef, useState } from 'react';

import { hotdogClassificationController } from '@/controllers/apiControllers';

import {
  createHotdogClassificationFailure,
  type HotdogClassificationFailure,
  runHotdogClassificationStep,
  toHotdogClassificationStepError,
} from './hotdogClassificationFailure';

export type HotdogClassificationState =
  | { status: 'idle' }
  | { status: 'uploading' }
  | { status: 'classifying' }
  | {
      status: 'classified';
      hotdogClassificationRecord: HotdogTypes.HotdogClassificationRecord;
    }
  | HotdogClassificationFailure;

/** One picked photo. Remembers the upload so a retry can skip straight to classifying. */
interface HotdogClassificationAttempt {
  imageFile: File;
  uploadedTempImagePath?: string;
}

/**
 * pick → validate → upload session → PUT to storage → classify.
 * Each run gets its own AbortController: a newer pick, or unmounting (e.g. the workspace
 * remounts after an erase), cancels the run's requests, and an aborted run sets no state.
 * A superseded attempt whose classify request already reached the server may still be
 * saved there; it isn't prepended now and shows up on the next history load (accepted).
 */
export const useHotdogClassification = ({
  onHotdogClassified,
}: {
  onHotdogClassified: (hotdogClassificationRecord: HotdogTypes.HotdogClassificationRecord) => void;
}) => {
  const [hotdogClassificationState, setHotdogClassificationState] =
    useState<HotdogClassificationState>({ status: 'idle' });
  const latestRunAbortControllerRef = useRef<AbortController>(undefined);
  const latestAttemptRef = useRef<HotdogClassificationAttempt>(undefined);

  const abortLatestRun = () => {
    latestRunAbortControllerRef.current?.abort();
  };

  const startNewRun = () => {
    abortLatestRun();
    latestRunAbortControllerRef.current = new AbortController();
    return latestRunAbortControllerRef.current.signal;
  };

  useEffect(() => {
    return abortLatestRun;
  }, []);

  /** Uploads the photo once per attempt; a retry after a successful upload reuses its path. */
  const uploadAttemptImage = async (
    attempt: HotdogClassificationAttempt,
    signal: AbortSignal,
  ): Promise<string | undefined> => {
    if (attempt.uploadedTempImagePath) {
      return attempt.uploadedTempImagePath;
    }

    setHotdogClassificationState({ status: 'uploading' });
    const hotdogImageUploadSession = await runHotdogClassificationStep(
      'creatingUploadSession',
      () =>
        hotdogClassificationController.createImageUploadSession(
          {
            // Validated before the attempt started.
            mediaType: attempt.imageFile.type as HotdogTypes.HotdogImageMediaType,
            byteSize: attempt.imageFile.size,
          },
          { signal },
        ),
    );

    if (signal.aborted) {
      return undefined;
    }

    await runHotdogClassificationStep('uploadingImage', () =>
      hotdogClassificationController.uploadImage({
        hotdogImageUploadSession,
        imageFile: attempt.imageFile,
        signal,
      }),
    );
    attempt.uploadedTempImagePath = hotdogImageUploadSession.tempImagePath;
    return attempt.uploadedTempImagePath;
  };

  const runAttempt = async (attempt: HotdogClassificationAttempt) => {
    const signal = startNewRun();

    try {
      const tempImagePath = await uploadAttemptImage(attempt, signal);

      if (!tempImagePath || signal.aborted) {
        return;
      }

      setHotdogClassificationState({ status: 'classifying' });
      const hotdogClassificationRecord = await runHotdogClassificationStep('classifying', () =>
        hotdogClassificationController.classifyUploadedImage({ tempImagePath }, { signal }),
      );

      if (signal.aborted) {
        return;
      }
      setHotdogClassificationState({ status: 'classified', hotdogClassificationRecord });
      onHotdogClassified(hotdogClassificationRecord);
    } catch (error) {
      if (signal.aborted) {
        return;
      }
      setHotdogClassificationState(
        createHotdogClassificationFailure(toHotdogClassificationStepError(error)),
      );
    }
  };

  /** Returns whether the photo passed validation and is being checked. */
  const classifyImage = (imageFile: File) => {
    const validationErrorMessage = getHotdogImageValidationErrorMessage({
      mediaType: imageFile.type,
      byteSize: imageFile.size,
    });

    if (validationErrorMessage) {
      abortLatestRun();
      latestAttemptRef.current = undefined;
      setHotdogClassificationState({
        status: 'failed',
        errorMessage: validationErrorMessage,
        canRetry: false,
      });
      return false;
    }

    latestAttemptRef.current = { imageFile };
    void runAttempt(latestAttemptRef.current);
    return true;
  };

  const retryHotdogClassification = () => {
    if (!latestAttemptRef.current) {
      return;
    }
    void runAttempt(latestAttemptRef.current);
  };

  return { hotdogClassificationState, classifyImage, retryHotdogClassification };
};
