'use client';

import type { ChangeEvent, ReactNode, Ref } from 'react';

import { type ButtonVariant, getButtonShapeClassName } from './buttonClassName';

interface FilePickerButtonProps {
  accept: string;
  variant: ButtonVariant;
  onFilePick: (file: File) => void;
  /** Lets callers restore keyboard focus to the picker (e.g. after a retry button unmounts). */
  inputRef?: Ref<HTMLInputElement>;
  className?: string;
  children: ReactNode;
}

/** A label styled as a button around a visually hidden file input. */
const FilePickerButton = ({
  accept,
  variant,
  onFilePick,
  inputRef,
  className = '',
  children,
}: FilePickerButtonProps) => {
  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const pickedFile = event.target.files?.[0];
    // Reset so picking the same file again still fires `change`.
    event.target.value = '';

    if (!pickedFile) {
      return;
    }
    onFilePick(pickedFile);
  };

  return (
    <label
      // Ring only for keyboard focus: clicking also focuses the hidden input.
      className={`cursor-pointer has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-focus-ring ${getButtonShapeClassName({ variant })} ${className}`}
    >
      {children}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleFileInputChange}
        className="sr-only"
      />
    </label>
  );
};

export default FilePickerButton;
