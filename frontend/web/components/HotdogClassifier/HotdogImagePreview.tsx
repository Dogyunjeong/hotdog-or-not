import Image from 'next/image';

interface HotdogImagePreviewProps {
  imagePreviewUrl?: string;
}

const HotdogImagePreview = ({ imagePreviewUrl }: HotdogImagePreviewProps) => {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-dashed border-zinc-300 bg-white dark:border-zinc-700 dark:bg-zinc-900">
      {imagePreviewUrl ? (
        // Blob URLs can't go through the image optimizer.
        <Image
          src={imagePreviewUrl}
          alt="Your uploaded photo"
          fill
          unoptimized
          className="object-cover"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-6xl" aria-hidden>
          🌭
        </div>
      )}
    </div>
  );
};

export default HotdogImagePreview;
