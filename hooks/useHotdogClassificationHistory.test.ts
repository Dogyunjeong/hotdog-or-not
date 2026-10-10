import { HotdogTypes } from '@/shared/types';
import { describe, expect, it } from 'vitest';

import {
  getHotdogClassificationHistoryState,
  mergeHotdogClassificationList,
  removeHotdogClassificationFromList,
  type SavedHotdogClassificationRecord,
} from './useHotdogClassificationHistory';

const createHotdogClassificationRecord = (id: string): SavedHotdogClassificationRecord => ({
  id,
  isHotdog: true,
  reason: 'Classic ballpark dog.',
  originalImageUrl: `https://storage.test/${id}.png`,
  thumbnailImageUrl: `https://storage.test/${id}-thumbnail.webp`,
  createdAt: '2026-10-10T12:00:00.000Z',
  details: null,
});

describe('mergeHotdogClassificationList', () => {
  it('puts newer records first, dedupes by id, and caps the list', () => {
    const fetchedList = Array.from(
      { length: HotdogTypes.HOTDOG_CLASSIFICATION_HISTORY_LIMIT },
      (_, recordIndex) => createHotdogClassificationRecord(`old-${recordIndex}`),
    );

    const mergedList = mergeHotdogClassificationList(
      [createHotdogClassificationRecord('new'), createHotdogClassificationRecord('old-0')],
      fetchedList,
    );

    expect(mergedList).toHaveLength(HotdogTypes.HOTDOG_CLASSIFICATION_HISTORY_LIMIT);
    expect(mergedList.slice(0, 3).map(({ id }) => id)).toEqual(['new', 'old-0', 'old-1']);
  });
});

describe('removeHotdogClassificationFromList', () => {
  it('drops only the deleted record and keeps the order', () => {
    const hotdogClassificationList = ['first', 'second', 'third'].map(
      createHotdogClassificationRecord,
    );

    const remainingList = removeHotdogClassificationFromList(hotdogClassificationList, 'second');

    expect(remainingList.map(({ id }) => id)).toEqual(['first', 'third']);
  });

  it('leaves the list as is when the record is already gone', () => {
    const hotdogClassificationList = [createHotdogClassificationRecord('first')];

    expect(removeHotdogClassificationFromList(hotdogClassificationList, 'missing')).toEqual(
      hotdogClassificationList,
    );
  });
});

describe('getHotdogClassificationHistoryState', () => {
  const loadedHistoryLoadState = {
    status: 'loaded' as const,
    hotdogClassificationList: [createHotdogClassificationRecord('first')],
  };

  it('shows a skeleton while the cookie banner is open', () => {
    expect(
      getHotdogClassificationHistoryState({
        historyConsentStatus: 'undecided',
        historyLoadState: loadedHistoryLoadState,
      }),
    ).toEqual({ status: 'loading' });
  });

  it('shows the guest state when history is off, ignoring any earlier load', () => {
    expect(
      getHotdogClassificationHistoryState({
        historyConsentStatus: 'disabled',
        historyLoadState: loadedHistoryLoadState,
      }),
    ).toEqual({ status: 'guest' });
  });

  it('shows enabling while history turns on', () => {
    expect(
      getHotdogClassificationHistoryState({
        historyConsentStatus: 'enabling',
        historyLoadState: { status: 'loading' },
      }),
    ).toEqual({ status: 'enabling' });
  });

  it('shows the load result once history is on', () => {
    expect(
      getHotdogClassificationHistoryState({
        historyConsentStatus: 'enabled',
        historyLoadState: loadedHistoryLoadState,
      }),
    ).toBe(loadedHistoryLoadState);
  });
});
