'use client';

import { HotdogTypes } from '@/shared/types';
import { useCallback, useEffect, useRef, useState } from 'react';

import { hotdogClassificationController } from '@/controllers/apiControllers';

import { type HistoryConsentStatus, useVisitorPrivacy } from './useVisitorPrivacy';

/** A result saved to the visitor's history (guest results have no id and never get here). */
export type SavedHotdogClassificationRecord = HotdogTypes.HotdogClassificationRecord & {
  id: string;
};

export const isSavedHotdogClassificationRecord = (
  hotdogClassificationRecord: HotdogTypes.HotdogClassificationRecord,
): hotdogClassificationRecord is SavedHotdogClassificationRecord => {
  return hotdogClassificationRecord.id !== null;
};

/** What the last history request produced while history consent is on. */
type HotdogClassificationHistoryLoadState =
  | { status: 'loading' }
  /** The server answered without history (no session cookie), so this visitor is a guest. */
  | { status: 'guest' }
  | { status: 'loaded'; hotdogClassificationList: SavedHotdogClassificationRecord[] }
  /** Keeps the verdicts from this visit, so they stay visible below the error. */
  | { status: 'failed'; hotdogClassificationList: SavedHotdogClassificationRecord[] };

/**
 * - `loading`: the cookie banner is still open, or the history request is in flight
 * - `enabling`: history was just turned on; the session is being started
 * - `guest`: history is off, nothing is saved
 */
export type HotdogClassificationHistoryState =
  HotdogClassificationHistoryLoadState | { status: 'enabling' };

/** Consent decides whether there is a history at all; only then does the load result count. */
export const getHotdogClassificationHistoryState = ({
  historyConsentStatus,
  historyLoadState,
}: {
  historyConsentStatus: HistoryConsentStatus;
  historyLoadState: HotdogClassificationHistoryLoadState;
}): HotdogClassificationHistoryState => {
  switch (historyConsentStatus) {
    case 'undecided':
      return { status: 'loading' };
    case 'enabling':
      return { status: 'enabling' };
    case 'disabled':
      return { status: 'guest' };
    case 'enabled':
      return historyLoadState;
  }
};

/** The records on screen; empty while there is no list to show. */
export const getVisibleHotdogClassificationList = (
  historyState: HotdogClassificationHistoryState,
): SavedHotdogClassificationRecord[] => {
  switch (historyState.status) {
    case 'loading':
    case 'enabling':
    case 'guest':
      return [];
    case 'loaded':
    case 'failed':
      return historyState.hotdogClassificationList;
  }
};

/** Newer records first, one entry per id, capped like the server's history. */
export const mergeHotdogClassificationList = (
  newerHotdogClassificationList: SavedHotdogClassificationRecord[],
  olderHotdogClassificationList: SavedHotdogClassificationRecord[],
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

export const removeHotdogClassificationFromList = (
  hotdogClassificationList: SavedHotdogClassificationRecord[],
  deletedHotdogClassificationId: string,
) => {
  return hotdogClassificationList.filter(
    (hotdogClassificationRecord) => hotdogClassificationRecord.id !== deletedHotdogClassificationId,
  );
};

/**
 * One history request merged with the verdicts prepended this visit (read when the answer
 * arrives, so one prepended mid-request is kept); a failure keeps those below the error.
 */
const fetchHotdogClassificationHistory = async (
  getPrependedHotdogClassificationList: () => SavedHotdogClassificationRecord[],
): Promise<HotdogClassificationHistoryLoadState> => {
  try {
    const { isHistoryEnabled, hotdogClassificationList } =
      await hotdogClassificationController.listClassifications();

    if (!isHistoryEnabled) {
      return { status: 'guest' };
    }
    return {
      status: 'loaded',
      hotdogClassificationList: mergeHotdogClassificationList(
        getPrependedHotdogClassificationList(),
        hotdogClassificationList.filter(isSavedHotdogClassificationRecord),
      ),
    };
  } catch {
    return { status: 'failed', hotdogClassificationList: getPrependedHotdogClassificationList() };
  }
};

/**
 * The visitor's history, fetched whenever history consent becomes `enabled` (never while the
 * banner is open or for guests). New verdicts are prepended locally (no refetch) and merged
 * into every load result, so one that arrives while loading or after a failed load is never lost.
 */
export const useHotdogClassificationHistory = () => {
  const { historyConsentStatus } = useVisitorPrivacy();
  const isHistoryConsentEnabled = historyConsentStatus === 'enabled';
  const [historyLoadState, setHistoryLoadState] = useState<HotdogClassificationHistoryLoadState>({
    status: 'loading',
  });
  const [wasHistoryConsentEnabled, setWasHistoryConsentEnabled] = useState(isHistoryConsentEnabled);
  const latestHistoryLoadIdRef = useRef(0);
  const prependedHotdogClassificationListRef = useRef<SavedHotdogClassificationRecord[]>([]);

  // A load result from an earlier consent period must not flash before the new load finishes.
  if (wasHistoryConsentEnabled !== isHistoryConsentEnabled) {
    setWasHistoryConsentEnabled(isHistoryConsentEnabled);
    setHistoryLoadState({ status: 'loading' });
  }

  const loadHistory = useCallback(() => {
    latestHistoryLoadIdRef.current += 1;
    const historyLoadId = latestHistoryLoadIdRef.current;

    void fetchHotdogClassificationHistory(() => prependedHotdogClassificationListRef.current).then(
      (fetchedHistoryLoadState) => {
        // Only the latest load may update state, so a slower, older answer is dropped.
        if (historyLoadId !== latestHistoryLoadIdRef.current) {
          return;
        }
        setHistoryLoadState(fetchedHistoryLoadState);
      },
    );
  }, []);

  // Only consent turning on starts a load; a pending "turn off history" keeps it `enabled`.
  useEffect(() => {
    if (!isHistoryConsentEnabled) {
      return;
    }
    loadHistory();
  }, [isHistoryConsentEnabled, loadHistory]);

  const reloadHistory = useCallback(() => {
    setHistoryLoadState({ status: 'loading' });
    loadHistory();
  }, [loadHistory]);

  const updateLoadedHotdogClassificationList = useCallback(
    (
      updateHotdogClassificationList: (
        hotdogClassificationList: SavedHotdogClassificationRecord[],
      ) => SavedHotdogClassificationRecord[],
    ) => {
      prependedHotdogClassificationListRef.current = updateHotdogClassificationList(
        prependedHotdogClassificationListRef.current,
      );
      setHistoryLoadState((previousHistoryLoadState) => {
        switch (previousHistoryLoadState.status) {
          case 'loading':
          case 'guest':
            return previousHistoryLoadState;
          case 'loaded':
          case 'failed':
            return {
              status: previousHistoryLoadState.status,
              hotdogClassificationList: updateHotdogClassificationList(
                previousHistoryLoadState.hotdogClassificationList,
              ),
            };
        }
      });
    },
    [],
  );

  const prependHotdogClassification = useCallback(
    (hotdogClassificationRecord: SavedHotdogClassificationRecord) => {
      updateLoadedHotdogClassificationList((hotdogClassificationList) =>
        mergeHotdogClassificationList([hotdogClassificationRecord], hotdogClassificationList),
      );
    },
    [updateLoadedHotdogClassificationList],
  );

  const removeHotdogClassification = useCallback(
    (deletedHotdogClassificationId: string) => {
      updateLoadedHotdogClassificationList((hotdogClassificationList) =>
        removeHotdogClassificationFromList(hotdogClassificationList, deletedHotdogClassificationId),
      );
    },
    [updateLoadedHotdogClassificationList],
  );

  return {
    historyState: getHotdogClassificationHistoryState({
      historyConsentStatus,
      historyLoadState,
    }),
    prependHotdogClassification,
    removeHotdogClassification,
    reloadHistory,
  };
};
