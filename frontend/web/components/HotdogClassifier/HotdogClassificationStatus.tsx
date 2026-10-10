import type { HotdogClassificationState } from '@/hooks/useHotdogClassification';

import HotdogVerdict from './HotdogVerdict';

interface HotdogClassificationStatusProps {
  hotdogClassificationState: HotdogClassificationState;
}

const HotdogClassificationStatus = ({
  hotdogClassificationState,
}: HotdogClassificationStatusProps) => {
  switch (hotdogClassificationState.status) {
    case 'idle':
      return <p className="text-center text-zinc-500">Pick a photo to get a verdict.</p>;
    case 'classifying':
      return (
        <p role="status" className="animate-pulse text-center text-zinc-500">
          Checking for hotdog...
        </p>
      );
    case 'classified':
      return (
        <HotdogVerdict hotdogClassification={hotdogClassificationState.hotdogClassification} />
      );
    case 'failed':
      return (
        <p role="alert" className="text-center text-red-600 dark:text-red-400">
          {hotdogClassificationState.errorMessage}
        </p>
      );
  }
};

export default HotdogClassificationStatus;
