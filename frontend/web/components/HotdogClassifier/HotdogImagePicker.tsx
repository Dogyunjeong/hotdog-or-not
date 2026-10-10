'use client';

import { HotdogTypes } from '@seamflow/shared-types';
import type { ChangeEvent } from 'react';

const ACCEPTED_IMAGE_MEDIA_TYPES = HotdogTypes.HOTDOG_IMAGE_MEDIA_TYPE_LIST.join(',');

interface HotdogImagePickerProps {
  isImagePickDisabled: boolean;
  onImagePick: (imageFile: File) => void;
}

const HotdogImagePicker = ({ isImagePickDisabled, onImagePick }: HotdogImagePickerProps) => {
  const handleImageInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const pickedImageFile = event.target.files?.[0];
    // Reset so picking the same file again still fires `change`.
    event.target.value = '';

    if (!pickedImageFile) {
      return;
    }
    onImagePick(pickedImageFile);
  };

  return (
    <label
      aria-disabled={isImagePickDisabled}
      className="cursor-pointer rounded-full bg-zinc-900 px-6 py-3 text-center font-medium text-white transition hover:bg-zinc-700 focus-within:ring-2 focus-within:ring-zinc-400 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
    >
      Upload a photo
      <input
        type="file"
        accept={ACCEPTED_IMAGE_MEDIA_TYPES}
        disabled={isImagePickDisabled}
        onChange={handleImageInputChange}
        className="sr-only"
      />
    </label>
  );
};

export default HotdogImagePicker;
