'use client';

import { useHotdogClassification } from '@/hooks/useHotdogClassification';
import { useImagePreviewUrl } from '@/hooks/useImagePreviewUrl';

import HotdogClassificationStatus from './HotdogClassificationStatus';
import HotdogImagePicker from './HotdogImagePicker';
import HotdogImagePreview from './HotdogImagePreview';

const HotdogClassifier = () => {
  const { imagePreviewUrl, showImagePreview } = useImagePreviewUrl();
  const { hotdogClassificationState, classifyImage } = useHotdogClassification();

  const handleImagePick = (imageFile: File) => {
    showImagePreview(imageFile);
    classifyImage(imageFile);
  };

  return (
    <section className="flex flex-col gap-4">
      <HotdogImagePreview imagePreviewUrl={imagePreviewUrl} />
      <HotdogClassificationStatus hotdogClassificationState={hotdogClassificationState} />
      <HotdogImagePicker
        isImagePickDisabled={hotdogClassificationState.status === 'classifying'}
        onImagePick={handleImagePick}
      />
    </section>
  );
};

export default HotdogClassifier;
