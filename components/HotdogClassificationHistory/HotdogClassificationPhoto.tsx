'use client';

import Image from 'next/image';
import { useState } from 'react';

const ImageOffIcon = () => {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-6"
    >
      <line x1="2" x2="22" y1="2" y2="22" />
      <path d="M10.41 10.41a2 2 0 1 1-2.83-2.83" />
      <line x1="13.5" x2="6" y1="13.5" y2="21" />
      <line x1="18" x2="21" y1="12" y2="15" />
      <path d="M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.052-.22 1.41-.59" />
      <path d="M21 15V5a2 2 0 0 0-2-2H9" />
    </svg>
  );
};

/**
 * - `thumb`: decorative 56px square inside a history card (the card's text names the result)
 * - `hero`: full-width 4:3 frame at the top of the detail view, showing the whole photo
 */
type HotdogClassificationPhotoSize = 'thumb' | 'hero';

const PHOTO_FRAME_CLASS_NAME: Record<HotdogClassificationPhotoSize, string> = {
  thumb: 'size-14 shrink-0 rounded-thumb',
  hero: 'aspect-[4/3] w-full rounded-card',
};

const PHOTO_FIT_CLASS_NAME: Record<HotdogClassificationPhotoSize, string> = {
  thumb: 'object-cover',
  hero: 'object-contain',
};

const PHOTO_PIXEL_SIZE: Record<HotdogClassificationPhotoSize, { width: number; height: number }> = {
  thumb: { width: 56, height: 56 },
  // Stored images are capped at a 1600px long edge.
  hero: { width: 1600, height: 1200 },
};

const PHOTO_UNAVAILABLE_LABEL = 'Photo no longer available';

const HotdogClassificationPhotoFallback = ({ size }: { size: HotdogClassificationPhotoSize }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 bg-surface-muted text-foreground-muted ${PHOTO_FRAME_CLASS_NAME[size]}`}
    >
      <ImageOffIcon />
      {size === 'hero' && <p className="text-sm">{PHOTO_UNAVAILABLE_LABEL}</p>}
    </div>
  );
};

interface HotdogClassificationPhotoProps {
  imageUrl: string;
  size: HotdogClassificationPhotoSize;
  /** Alt text; omit for a decorative thumbnail. */
  photoDescription?: string;
}

const HotdogClassificationPhoto = ({
  imageUrl,
  size,
  photoDescription = '',
}: HotdogClassificationPhotoProps) => {
  // No URL means the stored image is gone; a signed URL can also expire after an hour.
  // Remembering which URL failed lets a new URL try again without resetting state.
  const [failedImageUrl, setFailedImageUrl] = useState<string>();
  const hasImageLoadFailed = !imageUrl || failedImageUrl === imageUrl;

  if (hasImageLoadFailed) {
    return <HotdogClassificationPhotoFallback size={size} />;
  }

  return (
    // Signed storage URLs point at already-sized images; skip the optimizer.
    <Image
      src={imageUrl}
      alt={photoDescription}
      width={PHOTO_PIXEL_SIZE[size].width}
      height={PHOTO_PIXEL_SIZE[size].height}
      unoptimized
      onError={() => setFailedImageUrl(imageUrl)}
      className={`bg-surface-muted ${PHOTO_FIT_CLASS_NAME[size]} ${PHOTO_FRAME_CLASS_NAME[size]}`}
    />
  );
};

export default HotdogClassificationPhoto;
