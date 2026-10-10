import Image from 'next/image';

import Spinner from '@/components/primitives/Spinner';

interface HotdogImagePreviewProps {
  imagePreviewUrl?: string;
  isBusy: boolean;
}

const HotdogImagePreview = ({ imagePreviewUrl, isBusy }: HotdogImagePreviewProps) => {
  if (!imagePreviewUrl) {
    return (
      <div className="flex aspect-square w-full items-center justify-center rounded-card border-2 border-dashed border-border-strong bg-surface sm:aspect-[4/3]">
        <span aria-hidden className="text-6xl">
          🌭
        </span>
        <span className="sr-only">No photo picked yet</span>
      </div>
    );
  }

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-card bg-surface-muted sm:aspect-[4/3]">
      {/* Blob URLs can't go through the image optimizer. */}
      <Image src={imagePreviewUrl} alt="Your photo" fill unoptimized className="object-contain" />
      {isBusy && (
        <div className="absolute inset-0 flex items-center justify-center bg-overlay-scrim text-on-overlay">
          <Spinner size="md" />
        </div>
      )}
    </div>
  );
};

export default HotdogImagePreview;
