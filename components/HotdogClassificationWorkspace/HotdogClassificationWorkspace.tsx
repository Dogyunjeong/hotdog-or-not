'use client';

import HotdogClassificationHistory from '@/components/HotdogClassificationHistory/HotdogClassificationHistory';
import HotdogClassifier from '@/components/HotdogClassifier/HotdogClassifier';
import { useHotdogClassificationHistory } from '@/hooks/useHotdogClassificationHistory';

/** Connects the classifier to the history so a new verdict shows up without a refetch. */
const HotdogClassificationWorkspace = () => {
  const { historyState, prependHotdogClassification, reloadHistory } =
    useHotdogClassificationHistory();

  return (
    <div className="flex flex-col gap-8">
      <HotdogClassifier onHotdogClassified={prependHotdogClassification} />
      <HotdogClassificationHistory historyState={historyState} onRetry={reloadHistory} />
    </div>
  );
};

export default HotdogClassificationWorkspace;
