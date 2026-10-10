'use client';

import type { HotdogTypes } from '@/shared/types';
import { useRef } from 'react';

import { useHotdogClassification } from '@/hooks/useHotdogClassification';
import { useImagePreviewUrl } from '@/hooks/useImagePreviewUrl';
import { useVisitorPrivacy } from '@/hooks/useVisitorPrivacy';

import HotdogClassificationResultDetails from './HotdogClassificationResultDetails';
import HotdogClassificationStatus from './HotdogClassificationStatus';
import HotdogImagePicker from './HotdogImagePicker';
import HotdogImagePreview from './HotdogImagePreview';

interface HotdogClassifierProps {
  onHotdogClassified: (hotdogClassificationRecord: HotdogTypes.HotdogClassificationRecord) => void;
}

const HotdogClassifier = ({ onHotdogClassified }: HotdogClassifierProps) => {
  const { imagePreviewUrl, showImagePreview, clearImagePreview } = useImagePreviewUrl();
  const { hotdogClassificationState, classifyImage, retryHotdogClassification } =
    useHotdogClassification({ onHotdogClassified });
  const imagePickerInputRef = useRef<HTMLInputElement>(null);
  // While the session is being created, an upload could land half-guest, half-session.
  const isEnablingHistory = useVisitorPrivacy().historyConsentStatus === 'enabling';
  const isHotdogClassificationBusy =
    hotdogClassificationState.status === 'uploading' ||
    hotdogClassificationState.status === 'classifying';

  const handleImagePick = (imageFile: File) => {
    const isImageAccepted = classifyImage(imageFile);

    // A rejected file may not even be an image, so don't preview it.
    if (!isImageAccepted) {
      clearImagePreview();
      return;
    }
    showImagePreview(imageFile);
  };

  // "Try again" unmounts once the retry starts; move keyboard focus to the picker first.
  const handleRetry = () => {
    imagePickerInputRef.current?.focus();
    retryHotdogClassification();
  };

  return (
    <section aria-label="Check a photo" className="flex flex-col gap-4">
      <HotdogImagePreview imagePreviewUrl={imagePreviewUrl} isBusy={isHotdogClassificationBusy} />
      <HotdogClassificationStatus
        hotdogClassificationState={hotdogClassificationState}
        onRetry={handleRetry}
      />
      {hotdogClassificationState.status === 'classified' && (
        <HotdogClassificationResultDetails
          hotdogClassificationRecord={hotdogClassificationState.hotdogClassificationRecord}
        />
      )}
      <HotdogImagePicker
        status={hotdogClassificationState.status}
        isDisabled={isEnablingHistory}
        inputRef={imagePickerInputRef}
        onImagePick={handleImagePick}
      />
    </section>
  );
};

export default HotdogClassifier;
