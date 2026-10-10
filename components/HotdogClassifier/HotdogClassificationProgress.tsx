import Spinner from '@/components/primitives/Spinner';

type HotdogClassificationProgressStep = 'uploading' | 'classifying';

const HOTDOG_CLASSIFICATION_PROGRESS_MESSAGE: Record<HotdogClassificationProgressStep, string> = {
  uploading: 'Uploading your photo…',
  classifying: 'Checking for hotdog…',
};

interface HotdogClassificationProgressProps {
  step: HotdogClassificationProgressStep;
}

const HotdogClassificationProgress = ({ step }: HotdogClassificationProgressProps) => {
  return (
    <p className="flex items-center justify-center gap-2 text-foreground-muted">
      <Spinner size="sm" />
      {HOTDOG_CLASSIFICATION_PROGRESS_MESSAGE[step]}
    </p>
  );
};

export default HotdogClassificationProgress;
