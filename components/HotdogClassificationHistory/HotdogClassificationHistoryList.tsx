'use client';

import { HotdogTypes } from '@/shared/types';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

import type { SavedHotdogClassificationRecord } from '@/hooks/useHotdogClassificationHistory';

import HotdogClassificationHistoryEmpty from './HotdogClassificationHistoryEmpty';
import HotdogClassificationHistoryItem from './HotdogClassificationHistoryItem';

interface HotdogClassificationHistoryListProps {
  hotdogClassificationList: SavedHotdogClassificationRecord[];
  onHotdogClassificationSelect: (hotdogClassificationId: string) => void;
}

const HotdogClassificationHistoryList = ({
  hotdogClassificationList,
  onHotdogClassificationSelect,
}: HotdogClassificationHistoryListProps) => {
  const t = useTranslations('history');
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
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {hotdogClassificationList.map((hotdogClassificationRecord) => (
          <HotdogClassificationHistoryItem
            key={hotdogClassificationRecord.id}
            hotdogClassificationRecord={hotdogClassificationRecord}
            isNewHotdogClassification={
              !initialHotdogClassificationIdSet.has(hotdogClassificationRecord.id)
            }
            onHotdogClassificationSelect={onHotdogClassificationSelect}
          />
        ))}
      </ul>
      {hotdogClassificationList.length >= HotdogTypes.HOTDOG_CLASSIFICATION_HISTORY_LIMIT && (
        <p className="text-center text-xs text-foreground-muted">
          {t('recentLimit', { limit: HotdogTypes.HOTDOG_CLASSIFICATION_HISTORY_LIMIT })}
        </p>
      )}
    </div>
  );
};

export default HotdogClassificationHistoryList;
