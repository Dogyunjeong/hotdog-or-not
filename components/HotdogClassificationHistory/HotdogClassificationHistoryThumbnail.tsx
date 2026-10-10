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

interface HotdogClassificationHistoryThumbnailProps {
  imageUrl: string;
  createdAtLabel: string;
}

const HotdogClassificationHistoryThumbnail = ({
  imageUrl,
  createdAtLabel,
}: HotdogClassificationHistoryThumbnailProps) => {
  // No URL means the stored image is gone; a signed URL can also expire after an hour.
  const [hasImageLoadFailed, setHasImageLoadFailed] = useState(!imageUrl);

  if (hasImageLoadFailed) {
    return (
      <div className="flex size-14 shrink-0 items-center justify-center rounded-thumb bg-surface-muted text-foreground-muted">
        <ImageOffIcon />
        <span className="sr-only">Photo no longer available</span>
      </div>
    );
  }

  return (
    // Signed storage URLs are already sized for a thumbnail; skip the optimizer.
    <Image
      src={imageUrl}
      alt={`Your photo from ${createdAtLabel}`}
      width={56}
      height={56}
      unoptimized
      onError={() => setHasImageLoadFailed(true)}
      className="size-14 shrink-0 rounded-thumb bg-surface-muted object-cover"
    />
  );
};

export default HotdogClassificationHistoryThumbnail;
