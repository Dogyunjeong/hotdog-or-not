'use client';

import { useRef, useState } from 'react';

import type { HotdogClassificationHistoryState } from '@/hooks/useHotdogClassificationHistory';
import { useVisitorPrivacy } from '@/hooks/useVisitorPrivacy';

import { FOCUS_RING_CLASS_NAME } from '@/components/primitives/focusRing';
import OverflowMenu from '@/components/primitives/OverflowMenu';

import HotdogClassificationHistoryError from './HotdogClassificationHistoryError';
import HotdogClassificationHistoryGuest from './HotdogClassificationHistoryGuest';
import HotdogClassificationHistoryList from './HotdogClassificationHistoryList';
import HotdogClassificationHistoryLoading from './HotdogClassificationHistoryLoading';

/** Focus target when there is no card left to return to. */
export const HOTDOG_CLASSIFICATION_HISTORY_HEADING_ID = 'hotdog-classification-history-heading';
const HOTDOG_CLASSIFICATION_HISTORY_CONTENT_ID = 'hotdog-classification-history-content';
const HOTDOG_CLASSIFICATION_HISTORY_TITLE = 'Your history';

/** Only a non-empty list gets a count; the empty card already says there is nothing yet. */
const getHotdogClassificationHistoryCount = (historyState: HotdogClassificationHistoryState) => {
  switch (historyState.status) {
    case 'loading':
    case 'enabling':
    case 'guest':
      return undefined;
    case 'loaded':
    case 'failed':
      return historyState.hotdogClassificationList.length || undefined;
  }
};

interface HotdogClassificationHistoryContentProps {
  historyState: HotdogClassificationHistoryState;
  onRetry: () => void;
  onEnableHistory: () => void;
  onHotdogClassificationSelect: (hotdogClassificationId: string) => void;
}

const HotdogClassificationHistoryContent = ({
  historyState,
  onRetry,
  onEnableHistory,
  onHotdogClassificationSelect,
}: HotdogClassificationHistoryContentProps) => {
  switch (historyState.status) {
    case 'loading':
      return <HotdogClassificationHistoryLoading loadingMessage="Loading your history…" />;
    case 'enabling':
      return <HotdogClassificationHistoryLoading loadingMessage="Turning on history…" />;
    case 'guest':
      return <HotdogClassificationHistoryGuest onEnableHistory={onEnableHistory} />;
    case 'failed':
      return (
        <div className="flex flex-col gap-3">
          <HotdogClassificationHistoryError onRetry={onRetry} />
          {historyState.hotdogClassificationList.length > 0 && (
            <HotdogClassificationHistoryList
              hotdogClassificationList={historyState.hotdogClassificationList}
              onHotdogClassificationSelect={onHotdogClassificationSelect}
            />
          )}
        </div>
      );
    case 'loaded':
      return (
        <HotdogClassificationHistoryList
          hotdogClassificationList={historyState.hotdogClassificationList}
          onHotdogClassificationSelect={onHotdogClassificationSelect}
        />
      );
  }
};

interface HotdogClassificationHistoryCountProps {
  hotdogClassificationCount: number;
}

const HotdogClassificationHistoryCount = ({
  hotdogClassificationCount,
}: HotdogClassificationHistoryCountProps) => {
  return (
    <>
      <span aria-hidden className="text-foreground-muted">
        {hotdogClassificationCount}
      </span>
      <span className="sr-only">
        {hotdogClassificationCount === 1 ? '1 photo' : `${hotdogClassificationCount} photos`}
      </span>
    </>
  );
};

interface HotdogClassificationHistoryProps {
  historyState: HotdogClassificationHistoryState;
  onRetry: () => void;
  onHotdogClassificationSelect: (hotdogClassificationId: string) => void;
}

/**
 * Below `sm` the list collapses behind a disclosure button (open by default, in memory only);
 * from `sm` up it is always shown. At `lg` it sits in the sticky side panel, header pinned.
 * The header's "more" menu (Delete my data) sits outside the disclosure button.
 */
const HotdogClassificationHistory = ({
  historyState,
  onRetry,
  onHotdogClassificationSelect,
}: HotdogClassificationHistoryProps) => {
  const { enableHistory, openDeleteAllData } = useVisitorPrivacy();
  const historyHeadingRef = useRef<HTMLHeadingElement>(null);
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false);
  const hotdogClassificationCount = getHotdogClassificationHistoryCount(historyState);
  const isHistoryBusy = historyState.status === 'loading' || historyState.status === 'enabling';
  // Only a saved history has anything to delete.
  const isHistoryMenuShown = historyState.status === 'loaded' || historyState.status === 'failed';

  // "Try again" / "Turn on history" unmount once loading starts; keep keyboard focus in the section.
  const handleRetry = () => {
    historyHeadingRef.current?.focus();
    onRetry();
  };

  const handleEnableHistory = () => {
    historyHeadingRef.current?.focus();
    enableHistory();
  };

  return (
    <section
      aria-labelledby={HOTDOG_CLASSIFICATION_HISTORY_HEADING_ID}
      aria-busy={isHistoryBusy}
      className="flex flex-col gap-4"
    >
      <div className="flex items-center gap-2 lg:sticky lg:top-0 lg:z-10 lg:border-b lg:border-border lg:bg-surface lg:pt-4 lg:pb-2">
        <h2
          id={HOTDOG_CLASSIFICATION_HISTORY_HEADING_ID}
          ref={historyHeadingRef}
          tabIndex={-1}
          className="min-w-0 flex-1 text-lg font-semibold outline-none"
        >
          <button
            type="button"
            aria-expanded={!isHistoryCollapsed}
            aria-controls={HOTDOG_CLASSIFICATION_HISTORY_CONTENT_ID}
            onClick={() => setIsHistoryCollapsed((wasHistoryCollapsed) => !wasHistoryCollapsed)}
            className={`flex min-h-11 w-full items-center gap-2 rounded-control text-left sm:hidden ${FOCUS_RING_CLASS_NAME}`}
          >
            <span>
              {HOTDOG_CLASSIFICATION_HISTORY_TITLE}
              {hotdogClassificationCount !== undefined && (
                <>
                  <span aria-hidden className="text-foreground-muted">
                    {' · '}
                  </span>
                  <HotdogClassificationHistoryCount
                    hotdogClassificationCount={hotdogClassificationCount}
                  />
                </>
              )}
            </span>
            <span
              aria-hidden
              className={`ml-auto text-foreground-muted transition-transform ${isHistoryCollapsed ? '-rotate-90' : ''}`}
            >
              ▾
            </span>
          </button>
          <span className="hidden items-baseline gap-2 sm:flex">
            {HOTDOG_CLASSIFICATION_HISTORY_TITLE}
            {hotdogClassificationCount !== undefined && (
              <HotdogClassificationHistoryCount
                hotdogClassificationCount={hotdogClassificationCount}
              />
            )}
          </span>
        </h2>
        {isHistoryMenuShown && (
          <OverflowMenu
            triggerLabel="More history options"
            itemList={[{ label: 'Delete my data', onSelect: openDeleteAllData }]}
          />
        )}
      </div>
      <div
        id={HOTDOG_CLASSIFICATION_HISTORY_CONTENT_ID}
        className={isHistoryCollapsed ? 'hidden sm:block' : ''}
      >
        <HotdogClassificationHistoryContent
          historyState={historyState}
          onRetry={handleRetry}
          onEnableHistory={handleEnableHistory}
          onHotdogClassificationSelect={onHotdogClassificationSelect}
        />
      </div>
    </section>
  );
};

export default HotdogClassificationHistory;
