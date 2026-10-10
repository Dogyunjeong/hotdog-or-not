import { HotdogTypes } from '@/shared/types';
import { describe, expect, it } from 'vitest';

import { mergeHotdogClassificationList } from './useHotdogClassificationHistory';

const createHotdogClassificationRecord = (id: string): HotdogTypes.HotdogClassificationRecord => ({
  id,
  isHotdog: true,
  reason: 'Classic ballpark dog.',
  imageUrl: `https://storage.test/${id}.png`,
  createdAt: '2026-10-10T12:00:00.000Z',
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
