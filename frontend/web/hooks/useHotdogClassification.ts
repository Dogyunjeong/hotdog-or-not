'use client';

import type { HotdogTypes } from '@seamflow/shared-types';
import { ExpectedServerError } from '@seamflow/shared-utils/error';
import { getHotdogImageValidationErrorMessage } from '@seamflow/shared-utils/hotdog';
import { useRef, useState } from 'react';

import { hotdogClassificationController } from '@/controllers/apiControllers';

export type HotdogClassificationState =
  | { status: 'idle' }
  | { status: 'classifying' }
  | { status: 'classified'; hotdogClassification: HotdogTypes.HotdogClassification }
  | { status: 'failed'; errorMessage: string };

const DEFAULT_CLASSIFICATION_ERROR_MESSAGE =
  'We could not check your image right now. Please try again in a moment.';

const getClassificationErrorMessage = (error: unknown) => {
  if (error instanceof ExpectedServerError) {
    return error.message;
  }
  return DEFAULT_CLASSIFICATION_ERROR_MESSAGE;
};

export const useHotdogClassification = () => {
  const [hotdogClassificationState, setHotdogClassificationState] =
    useState<HotdogClassificationState>({ status: 'idle' });
  // Only the latest pick may update state; an earlier, slower response is dropped.
  const latestClassificationIdRef = useRef(0);

  const classifyImage = async (imageFile: File) => {
    latestClassificationIdRef.current += 1;
    const classificationId = latestClassificationIdRef.current;
    const isLatestClassification = () => classificationId === latestClassificationIdRef.current;

    const validationErrorMessage = getHotdogImageValidationErrorMessage({
      mediaType: imageFile.type,
      byteSize: imageFile.size,
    });

    if (validationErrorMessage) {
      setHotdogClassificationState({ status: 'failed', errorMessage: validationErrorMessage });
      return;
    }

    setHotdogClassificationState({ status: 'classifying' });

    try {
      const hotdogClassification = await hotdogClassificationController.classifyImage({
        imageFile,
      });

      if (!isLatestClassification()) {
        return;
      }
      setHotdogClassificationState({ status: 'classified', hotdogClassification });
    } catch (error) {
      if (!isLatestClassification()) {
        return;
      }
      setHotdogClassificationState({
        status: 'failed',
        errorMessage: getClassificationErrorMessage(error),
      });
    }
  };

  return { hotdogClassificationState, classifyImage };
};
