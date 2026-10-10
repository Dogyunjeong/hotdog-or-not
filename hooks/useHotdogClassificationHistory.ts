'use client';

import { HotdogTypes } from '@/shared/types';
import { useCallback, useEffect, useRef, useState } from 'react';

import { hotdogClassificationController } from '@/controllers/apiControllers';

/**
 * `failed` keeps the verdicts from this visit, so they stay visible below the error
 * while the visitor can still retry loading the rest.
 */
export type HotdogClassificationHistoryState =
  | { status: 'loading' }
  | { status: 'loaded'; hotdogClassificationList: HotdogTypes.HotdogClassificationRecord[] }
  | { status: 'failed'; hotdogClassificationList: HotdogTypes.HotdogClassificationRecord[] };

/** Newer records first, one entry per id, capped like the server's history. */
export const mergeHotdogClassificationList = (
  newerHotdogClassificationList: HotdogTypes.HotdogClassificationRecord[],
  olderHotdogClassificationList: HotdogTypes.HotdogClassificationRecord[],
) => {
  const seenHotdogClassificationIdSet = new Set<string>();

  return [...newerHotdogClassificationList, ...olderHotdogClassificationList]
    .filter((hotdogClassificationRecord) => {
      if (seenHotdogClassificationIdSet.has(hotdogClassificationRecord.id)) {
        return false;
      }
      seenHotdogClassificationIdSet.add(hotdogClassificationRecord.id);
      return true;
    })
    .slice(0, HotdogTypes.HOTDOG_CLASSIFICATION_HISTORY_LIMIT);
};

/**
 * The visitor's history, fetched on mount. New verdicts are prepended locally (no refetch)
 * and merged into every load result, so one that arrives while loading or after a failed
 * load is never lost.
 */
export const useHotdogClassificationHistory = () => {
  const [historyState, setHistoryState] = useState<HotdogClassificationHistoryState>({
    status: 'loading',
  });
  const latestHistoryLoadIdRef = useRef(0);
  const prependedHotdogClassificationListRef = useRef<HotdogTypes.HotdogClassificationRecord[]>([]);

  const loadHistory = useCallback(async () => {
    latestHistoryLoadIdRef.current += 1;
    const historyLoadId = latestHistoryLoadIdRef.current;
    const isLatestHistoryLoad = () => historyLoadId === latestHistoryLoadIdRef.current;

    try {
      const { hotdogClassificationList } =
        await hotdogClassificationController.listClassifications();

      if (!isLatestHistoryLoad()) {
        return;
      }
      setHistoryState({
        status: 'loaded',
        hotdogClassificationList: mergeHotdogClassificationList(
          prependedHotdogClassificationListRef.current,
          hotdogClassificationList,
        ),
      });
    } catch {
      if (!isLatestHistoryLoad()) {
        return;
      }
      setHistoryState({
        status: 'failed',
        hotdogClassificationList: prependedHotdogClassificationListRef.current,
      });
    }
  }, []);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const reloadHistory = useCallback(() => {
    setHistoryState({ status: 'loading' });
    void loadHistory();
  }, [loadHistory]);

  const prependHotdogClassification = useCallback(
    (hotdogClassificationRecord: HotdogTypes.HotdogClassificationRecord) => {
      prependedHotdogClassificationListRef.current = mergeHotdogClassificationList(
        [hotdogClassificationRecord],
        prependedHotdogClassificationListRef.current,
      );
      setHistoryState((previousHistoryState) => {
        switch (previousHistoryState.status) {
          case 'loading':
            return previousHistoryState;
          case 'loaded':
          case 'failed':
            return {
              status: previousHistoryState.status,
              hotdogClassificationList: mergeHotdogClassificationList(
                [hotdogClassificationRecord],
                previousHistoryState.hotdogClassificationList,
              ),
            };
        }
      });
    },
    [],
  );

  return { historyState, prependHotdogClassification, reloadHistory };
};
