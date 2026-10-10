import { HotdogTypes } from '@/shared/types';
import type { Ref } from 'react';

import type { ButtonVariant } from '@/components/primitives/buttonClassName';
import FilePickerButton from '@/components/primitives/FilePickerButton';
import type { HotdogClassificationState } from '@/hooks/useHotdogClassification';

const ACCEPTED_IMAGE_MEDIA_TYPES = HotdogTypes.HOTDOG_IMAGE_MEDIA_TYPE_LIST.join(',');

type HotdogClassificationStateStatus = HotdogClassificationState['status'];

const getHotdogImagePickerAppearance = (
  status: HotdogClassificationStateStatus,
): { label: string; variant: ButtonVariant } => {
  switch (status) {
    case 'idle':
      return { label: 'Upload a photo', variant: 'primary' };
    case 'uploading':
    case 'classifying':
      // Stays enabled: a new pick replaces the one in progress.
      return { label: 'Choose a different photo', variant: 'secondary' };
    case 'classified':
      return { label: 'Try another photo', variant: 'primary' };
    case 'failed':
      return { label: 'Choose a different photo', variant: 'primary' };
  }
};

interface HotdogImagePickerProps {
  status: HotdogClassificationStateStatus;
  isDisabled: boolean;
  inputRef: Ref<HTMLInputElement>;
  onImagePick: (imageFile: File) => void;
}

const HotdogImagePicker = ({
  status,
  isDisabled,
  inputRef,
  onImagePick,
}: HotdogImagePickerProps) => {
  const { label, variant } = getHotdogImagePickerAppearance(status);

  return (
    <FilePickerButton
      accept={ACCEPTED_IMAGE_MEDIA_TYPES}
      variant={variant}
      onFilePick={onImagePick}
      inputRef={inputRef}
      isDisabled={isDisabled}
      className="w-full"
    >
      {label}
    </FilePickerButton>
  );
};

export default HotdogImagePicker;
