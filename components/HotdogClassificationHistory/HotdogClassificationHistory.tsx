'use client';

import { useRef } from 'react';

import type { HotdogClassificationHistoryState } from '@/hooks/useHotdogClassificationHistory';

import HotdogClassificationHistoryError from './HotdogClassificationHistoryError';
import HotdogClassificationHistoryList from './HotdogClassificationHistoryList';
import HotdogClassificationHistoryLoading from './HotdogClassificationHistoryLoading';

const HOTDOG_CLASSIFICATION_HISTORY_HEADING_ID = 'hotdog-classification-history-heading';

interface HotdogClassificationHistoryProps {
  historyState: HotdogClassificationHistoryState;
  onRetry: () => void;
}

const HotdogClassificationHistoryContent = ({
  historyState,
  onRetry,
}: HotdogClassificationHistoryProps) => {
  switch (historyState.status) {
    case 'loading':
      return <HotdogClassificationHistoryLoading />;
    case 'failed':
      return (
        <div className="flex flex-col gap-3">
          <HotdogClassificationHistoryError onRetry={onRetry} />
          {historyState.hotdogClassificationList.length > 0 && (
            <HotdogClassificationHistoryList
              hotdogClassificationList={historyState.hotdogClassificationList}
            />
          )}
        </div>
      );
    case 'loaded':
      return (
        <HotdogClassificationHistoryList
          hotdogClassificationList={historyState.hotdogClassificationList}
        />
      );
  }
};

const HotdogClassificationHistory = ({
  historyState,
  onRetry,
}: HotdogClassificationHistoryProps) => {
  const historyHeadingRef = useRef<HTMLHeadingElement>(null);

  // "Try again" unmounts once loading starts; keep keyboard focus in the section.
  const handleRetry = () => {
    historyHeadingRef.current?.focus();
    onRetry();
  };

  return (
    <section
      aria-labelledby={HOTDOG_CLASSIFICATION_HISTORY_HEADING_ID}
      aria-busy={historyState.status === 'loading'}
      className="flex flex-col gap-4"
    >
      <h2
        id={HOTDOG_CLASSIFICATION_HISTORY_HEADING_ID}
        ref={historyHeadingRef}
        tabIndex={-1}
        className="text-lg font-semibold outline-none"
      >
        Your history
      </h2>
      <HotdogClassificationHistoryContent historyState={historyState} onRetry={handleRetry} />
    </section>
  );
};

export default HotdogClassificationHistory;
