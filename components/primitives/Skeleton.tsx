interface SkeletonProps {
  className?: string;
}

/** Decorative placeholder block; pair the loading area with sr-only text. */
const Skeleton = ({ className = '' }: SkeletonProps) => {
  return <div aria-hidden className={`bg-surface-muted motion-safe:animate-pulse ${className}`} />;
};

export default Skeleton;
