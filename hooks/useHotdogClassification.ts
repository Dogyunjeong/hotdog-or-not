'use client';

import type { HotdogTypes } from '@/shared/types';
import { getHotdogImageValidationErrorMessage } from '@/shared/utils/hotdog';
import { useRef, useState } from 'react';

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
 * Only the latest attempt may update state, so a newer pick drops an older, slower result.
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
  const latestAttemptIdRef = useRef(0);
  const latestAttemptRef = useRef<HotdogClassificationAttempt>(undefined);

  const startNewAttemptId = () => {
    latestAttemptIdRef.current += 1;
    return latestAttemptIdRef.current;
  };

  /** Uploads the photo once per attempt; a retry after a successful upload reuses its path. */
  const uploadAttemptImage = async (
    attempt: HotdogClassificationAttempt,
    isLatestAttempt: () => boolean,
  ): Promise<string | undefined> => {
    if (attempt.uploadedTempImagePath) {
      return attempt.uploadedTempImagePath;
    }

    setHotdogClassificationState({ status: 'uploading' });
    const hotdogImageUploadSession = await runHotdogClassificationStep(
      'creatingUploadSession',
      () =>
        hotdogClassificationController.createImageUploadSession({
          // Validated before the attempt started.
          mediaType: attempt.imageFile.type as HotdogTypes.HotdogImageMediaType,
          byteSize: attempt.imageFile.size,
        }),
    );

    if (!isLatestAttempt()) {
      return undefined;
    }

    await runHotdogClassificationStep('uploadingImage', () =>
      hotdogClassificationController.uploadImage({
        hotdogImageUploadSession,
        imageFile: attempt.imageFile,
      }),
    );
    attempt.uploadedTempImagePath = hotdogImageUploadSession.tempImagePath;
    return attempt.uploadedTempImagePath;
  };

  const runAttempt = async (attempt: HotdogClassificationAttempt) => {
    const attemptId = startNewAttemptId();
    const isLatestAttempt = () => attemptId === latestAttemptIdRef.current;

    try {
      const tempImagePath = await uploadAttemptImage(attempt, isLatestAttempt);

      if (!tempImagePath || !isLatestAttempt()) {
        return;
      }

      setHotdogClassificationState({ status: 'classifying' });
      const hotdogClassificationRecord = await runHotdogClassificationStep('classifying', () =>
        hotdogClassificationController.classifyUploadedImage({ tempImagePath }),
      );

      if (!isLatestAttempt()) {
        return;
      }
      setHotdogClassificationState({ status: 'classified', hotdogClassificationRecord });
      onHotdogClassified(hotdogClassificationRecord);
    } catch (error) {
      if (!isLatestAttempt()) {
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
      startNewAttemptId();
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
