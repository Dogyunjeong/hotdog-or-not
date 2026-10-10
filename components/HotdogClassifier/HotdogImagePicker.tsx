import { HotdogTypes } from '@/shared/types';
import { useTranslations } from 'next-intl';
import type { Ref } from 'react';

import type { ButtonVariant } from '@/components/primitives/buttonClassName';
import FilePickerButton from '@/components/primitives/FilePickerButton';
import type { HotdogClassificationState } from '@/hooks/useHotdogClassification';

const ACCEPTED_IMAGE_MEDIA_TYPES = HotdogTypes.HOTDOG_IMAGE_MEDIA_TYPE_LIST.join(',');

type HotdogClassificationStateStatus = HotdogClassificationState['status'];

type HotdogImagePickerLabelKey = 'upload' | 'chooseDifferent' | 'tryAnother';

const getHotdogImagePickerAppearance = (
  status: HotdogClassificationStateStatus,
): { labelKey: HotdogImagePickerLabelKey; variant: ButtonVariant } => {
  switch (status) {
    case 'idle':
      return { labelKey: 'upload', variant: 'primary' };
    case 'uploading':
    case 'classifying':
      // Stays enabled: a new pick replaces the one in progress.
      return { labelKey: 'chooseDifferent', variant: 'secondary' };
    case 'classified':
      return { labelKey: 'tryAnother', variant: 'primary' };
    case 'failed':
      return { labelKey: 'chooseDifferent', variant: 'primary' };
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
  const t = useTranslations('classifier.picker');
  const { labelKey, variant } = getHotdogImagePickerAppearance(status);

  return (
    <FilePickerButton
      accept={ACCEPTED_IMAGE_MEDIA_TYPES}
      variant={variant}
      onFilePick={onImagePick}
      inputRef={inputRef}
      isDisabled={isDisabled}
      className="w-full"
    >
      {t(labelKey)}
    </FilePickerButton>
  );
};

export default HotdogImagePicker;
