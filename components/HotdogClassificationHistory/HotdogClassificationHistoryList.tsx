'use client';

import { HotdogTypes } from '@/shared/types';
import { useState } from 'react';

import HotdogClassificationHistoryEmpty from './HotdogClassificationHistoryEmpty';
import HotdogClassificationHistoryItem from './HotdogClassificationHistoryItem';

interface HotdogClassificationHistoryListProps {
  hotdogClassificationList: HotdogTypes.HotdogClassificationRecord[];
}

const HotdogClassificationHistoryList = ({
  hotdogClassificationList,
}: HotdogClassificationHistoryListProps) => {
  // Records present when the list first rendered came from the server; later ones are new.
  const [initialHotdogClassificationIdSet] = useState(
    () =>
      new Set(
        hotdogClassificationList.map((hotdogClassificationRecord) => hotdogClassificationRecord.id),
      ),
  );

  if (hotdogClassificationList.length === 0) {
    return <HotdogClassificationHistoryEmpty />;
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-3">
        {hotdogClassificationList.map((hotdogClassificationRecord) => (
          <HotdogClassificationHistoryItem
            key={hotdogClassificationRecord.id}
            hotdogClassificationRecord={hotdogClassificationRecord}
            isNewHotdogClassification={
              !initialHotdogClassificationIdSet.has(hotdogClassificationRecord.id)
            }
          />
        ))}
      </ul>
      {hotdogClassificationList.length >= HotdogTypes.HOTDOG_CLASSIFICATION_HISTORY_LIMIT && (
        <p className="text-center text-xs text-foreground-muted">
          Showing your {HotdogTypes.HOTDOG_CLASSIFICATION_HISTORY_LIMIT} most recent photos.
        </p>
      )}
    </div>
  );
};

export default HotdogClassificationHistoryList;
