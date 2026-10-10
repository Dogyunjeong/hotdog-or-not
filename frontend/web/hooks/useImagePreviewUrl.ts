'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Object URL for previewing a picked file. Revokes the previous URL on change
 * and the last one on unmount so blobs don't leak.
 */
export const useImagePreviewUrl = () => {
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>();
  const imagePreviewUrlRef = useRef<string>(undefined);

  const showImagePreview = (imageFile: File) => {
    if (imagePreviewUrlRef.current) {
      URL.revokeObjectURL(imagePreviewUrlRef.current);
    }

    const nextImagePreviewUrl = URL.createObjectURL(imageFile);
    imagePreviewUrlRef.current = nextImagePreviewUrl;
    setImagePreviewUrl(nextImagePreviewUrl);
  };

  useEffect(() => {
    return () => {
      if (imagePreviewUrlRef.current) {
        URL.revokeObjectURL(imagePreviewUrlRef.current);
      }
    };
  }, []);

  return { imagePreviewUrl, showImagePreview };
};
