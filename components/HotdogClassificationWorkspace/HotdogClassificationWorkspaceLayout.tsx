'use client';

import type { HotdogTypes } from '@/shared/types';
import { useEffect, useRef, useState } from 'react';

import { useHotdogClassificationDeletion } from '@/hooks/useHotdogClassificationDeletion';
import {
  getVisibleHotdogClassificationList,
  isSavedHotdogClassificationRecord,
  useHotdogClassificationHistory,
} from '@/hooks/useHotdogClassificationHistory';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useVisitorPrivacy } from '@/hooks/useVisitorPrivacy';

import HotdogClassificationDetailDrawer from '@/components/HotdogClassificationDetailView/HotdogClassificationDetailDrawer';
import HotdogClassificationDeletionDialog from '@/components/HotdogClassificationDetailView/HotdogClassificationDeletionDialog';
import HotdogClassificationDetailPanel from '@/components/HotdogClassificationDetailView/HotdogClassificationDetailPanel';
import { HOTDOG_CLASSIFICATION_DETAIL_HEADING_ID } from '@/components/HotdogClassificationDetailView/HotdogClassificationDetailView';
import HotdogClassificationHistory, {
  HOTDOG_CLASSIFICATION_HISTORY_HEADING_ID,
} from '@/components/HotdogClassificationHistory/HotdogClassificationHistory';
import { getHotdogClassificationHistoryItemElementId } from '@/components/HotdogClassificationHistory/HotdogClassificationHistoryItem';
import HotdogClassifier from '@/components/HotdogClassifier/HotdogClassifier';

/** Matches Tailwind's `lg`: from here history is a side panel and details replace its list. */
const DESKTOP_LAYOUT_MEDIA_QUERY = '(min-width: 64rem)';

/** Where keyboard focus returns once the details close. */
type HistoryFocusTarget =
  { kind: 'historyItem'; hotdogClassificationId: string } | { kind: 'historyHeading' };

const getHistoryFocusElementId = (historyFocusTarget: HistoryFocusTarget) => {
  switch (historyFocusTarget.kind) {
    case 'historyItem':
      return getHotdogClassificationHistoryItemElementId(historyFocusTarget.hotdogClassificationId);
    case 'historyHeading':
      return HOTDOG_CLASSIFICATION_HISTORY_HEADING_ID;
  }
};

/** After a delete, the next card takes the deleted one's place; else the previous one. */
const getHistoryFocusTargetAfterDeletion = (
  hotdogClassificationList: { id: string }[],
  deletedHotdogClassificationId: string,
): HistoryFocusTarget => {
  const deletedHotdogClassificationIndex = hotdogClassificationList.findIndex(
    (hotdogClassificationRecord) => hotdogClassificationRecord.id === deletedHotdogClassificationId,
  );
  const neighborHotdogClassificationRecord =
    deletedHotdogClassificationIndex === -1
      ? undefined
      : (hotdogClassificationList[deletedHotdogClassificationIndex + 1] ??
        hotdogClassificationList[deletedHotdogClassificationIndex - 1]);

  if (!neighborHotdogClassificationRecord) {
    return { kind: 'historyHeading' };
  }
  return {
    kind: 'historyItem',
    hotdogClassificationId: neighborHotdogClassificationRecord.id,
  };
};

/**
 * Classifier + history, and which saved result is open. Details show in the side panel on
 * desktop and in a drawer below it; crossing the breakpoint moves an open result across.
 */
const HotdogClassificationWorkspaceLayout = () => {
  const { showNotice } = useVisitorPrivacy();
  const { historyState, prependHotdogClassification, removeHotdogClassification, reloadHistory } =
    useHotdogClassificationHistory();
  const isDesktopLayout = useMediaQuery(DESKTOP_LAYOUT_MEDIA_QUERY);
  const [selectedHotdogClassificationId, setSelectedHotdogClassificationId] = useState<
    string | null
  >(null);
  const [historyFocusTarget, setHistoryFocusTarget] = useState<HistoryFocusTarget | null>(null);
  const historyPanelRef = useRef<HTMLDivElement>(null);
  const historyPanelScrollTopRef = useRef(0);

  const visibleHotdogClassificationList = getVisibleHotdogClassificationList(historyState);
  const selectedHotdogClassificationRecord =
    visibleHotdogClassificationList.find(
      (hotdogClassificationRecord) =>
        hotdogClassificationRecord.id === selectedHotdogClassificationId,
    ) ?? null;
  const openHotdogClassificationId = selectedHotdogClassificationRecord?.id ?? null;
  const panelHotdogClassificationRecord = isDesktopLayout
    ? selectedHotdogClassificationRecord
    : null;
  const drawerHotdogClassificationRecord = isDesktopLayout
    ? null
    : selectedHotdogClassificationRecord;

  // Opening details (or moving them across the breakpoint) focuses their heading. This runs
  // after the drawer's own effect, so it wins over the dialog's default initial focus.
  useEffect(() => {
    if (!openHotdogClassificationId) {
      return;
    }

    if (isDesktopLayout && historyPanelRef.current) {
      historyPanelRef.current.scrollTop = 0;
    }
    document.getElementById(HOTDOG_CLASSIFICATION_DETAIL_HEADING_ID)?.focus();
  }, [openHotdogClassificationId, isDesktopLayout]);

  // Closing details returns focus to the list, scrolled back to where the visitor left it.
  useEffect(() => {
    if (!historyFocusTarget) {
      return;
    }

    if (historyPanelRef.current) {
      historyPanelRef.current.scrollTop = historyPanelScrollTopRef.current;
    }
    document.getElementById(getHistoryFocusElementId(historyFocusTarget))?.focus();
  }, [historyFocusTarget]);

  const handleHotdogClassified = (
    hotdogClassificationRecord: HotdogTypes.HotdogClassificationRecord,
  ) => {
    // Guest results are never saved, so they don't belong in the history.
    if (!isSavedHotdogClassificationRecord(hotdogClassificationRecord)) {
      return;
    }
    prependHotdogClassification(hotdogClassificationRecord);
  };

  const handleHotdogClassificationSelect = (hotdogClassificationId: string) => {
    historyPanelScrollTopRef.current = historyPanelRef.current?.scrollTop ?? 0;
    setSelectedHotdogClassificationId(hotdogClassificationId);
  };

  const handleDetailClose = () => {
    if (!openHotdogClassificationId) {
      return;
    }
    setSelectedHotdogClassificationId(null);
    setHistoryFocusTarget({
      kind: 'historyItem',
      hotdogClassificationId: openHotdogClassificationId,
    });
  };

  const { deletionState, requestDeletion, cancelDeletion, confirmDeletion } =
    useHotdogClassificationDeletion({
      onHotdogClassificationDeleted: (deletedHotdogClassificationId) => {
        setHistoryFocusTarget(
          getHistoryFocusTargetAfterDeletion(
            visibleHotdogClassificationList,
            deletedHotdogClassificationId,
          ),
        );
        removeHotdogClassification(deletedHotdogClassificationId);
        setSelectedHotdogClassificationId(null);
        showNotice('Photo deleted.');
      },
    });

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_var(--container-history-panel)] lg:items-start">
        <div className="mx-auto w-full max-w-2xl min-w-0">
          <HotdogClassifier onHotdogClassified={handleHotdogClassified} />
        </div>
        <div
          ref={historyPanelRef}
          className="min-w-0 lg:sticky lg:top-6 lg:max-h-[calc(100dvh-3rem)] lg:scroll-pt-20 lg:overflow-y-auto lg:overscroll-contain lg:rounded-card lg:border lg:border-border lg:bg-surface lg:px-4 lg:pb-4"
        >
          {/* Shown again after `hidden`, the fade replays, so back from details fades in too. */}
          <div
            hidden={panelHotdogClassificationRecord !== null}
            className="motion-safe:animate-status-enter"
          >
            <HotdogClassificationHistory
              historyState={historyState}
              onRetry={reloadHistory}
              onHotdogClassificationSelect={handleHotdogClassificationSelect}
            />
          </div>
          {panelHotdogClassificationRecord && (
            <HotdogClassificationDetailPanel
              key={panelHotdogClassificationRecord.id}
              hotdogClassificationRecord={panelHotdogClassificationRecord}
              onBack={handleDetailClose}
              onDeletionRequest={requestDeletion}
            />
          )}
        </div>
      </div>
      <HotdogClassificationDetailDrawer
        hotdogClassificationRecord={drawerHotdogClassificationRecord}
        onClose={handleDetailClose}
        onDeletionRequest={requestDeletion}
      />
      {/*
        After the drawer and remounted on a breakpoint switch, so it is shown (again) after the
        drawer opens and stays on top of it; its pending/error state lives in the hook above.
      */}
      <HotdogClassificationDeletionDialog
        key={isDesktopLayout ? 'desktop' : 'mobile'}
        deletionState={deletionState}
        onConfirm={() => void confirmDeletion()}
        onCancel={cancelDeletion}
      />
    </>
  );
};

export default HotdogClassificationWorkspaceLayout;
