'use client';

import { useTranslations } from 'next-intl';
import type { KeyboardEvent } from 'react';

import type { SavedHotdogClassificationRecord } from '@/hooks/useHotdogClassificationHistory';

import Button from '@/components/primitives/Button';

import HotdogClassificationDetailView, {
  HOTDOG_CLASSIFICATION_DETAIL_HEADING_ID,
} from './HotdogClassificationDetailView';

interface HotdogClassificationDetailPanelProps {
  hotdogClassificationRecord: SavedHotdogClassificationRecord;
  onBack: () => void;
  onDeletionRequest: (hotdogClassificationId: string) => void;
}

/** Desktop: the details replace the history list inside the side panel. */
const HotdogClassificationDetailPanel = ({
  hotdogClassificationRecord,
  onBack,
  onDeletionRequest,
}: HotdogClassificationDetailPanelProps) => {
  const t = useTranslations('detailView');

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== 'Escape') {
      return;
    }
    onBack();
  };

  return (
    <section
      aria-labelledby={HOTDOG_CLASSIFICATION_DETAIL_HEADING_ID}
      onKeyDown={handleKeyDown}
      className="flex flex-col gap-2"
    >
      <div className="sticky top-0 z-10 border-b border-border bg-surface pt-4 pb-2">
        <Button variant="secondary" size="sm" aria-label={t('backAriaLabel')} onClick={onBack}>
          <span aria-hidden>←</span> {t('backLabel')}
        </Button>
      </div>
      <HotdogClassificationDetailView
        hotdogClassificationRecord={hotdogClassificationRecord}
        onDeletionRequest={onDeletionRequest}
      />
    </section>
  );
};

export default HotdogClassificationDetailPanel;
