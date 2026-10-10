'use client';

import { useTranslations } from 'next-intl';

import type { SavedHotdogClassificationRecord } from '@/hooks/useHotdogClassificationHistory';

import { useHotdogClassificationLabel } from '@/components/HotdogClassificationHistory/hotdogClassificationLabel';
import Button from '@/components/primitives/Button';
import Drawer from '@/components/primitives/Drawer';

import HotdogClassificationDetailView, {
  HOTDOG_CLASSIFICATION_DETAIL_HEADING_ID,
} from './HotdogClassificationDetailView';

const CloseIcon = () => {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
    >
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
};

interface HotdogClassificationDetailDrawerProps {
  /** `null` keeps the drawer closed. */
  hotdogClassificationRecord: SavedHotdogClassificationRecord | null;
  onClose: () => void;
  onDeletionRequest: (hotdogClassificationId: string) => void;
}

/** Below `lg`: the details open in a full-height drawer over the page. */
const HotdogClassificationDetailDrawer = ({
  hotdogClassificationRecord,
  onClose,
  onDeletionRequest,
}: HotdogClassificationDetailDrawerProps) => {
  const t = useTranslations('detailView');
  const { getHotdogClassificationDetailTitle } = useHotdogClassificationLabel();

  return (
    <Drawer
      isOpen={hotdogClassificationRecord !== null}
      onClose={onClose}
      labelledById={HOTDOG_CLASSIFICATION_DETAIL_HEADING_ID}
      header={
        <div className="flex items-center justify-between gap-3">
          {/* Keeps the title in view while scrolling; the h2 below names the drawer. */}
          <span aria-hidden className="min-w-0 truncate text-sm font-medium">
            {hotdogClassificationRecord &&
              getHotdogClassificationDetailTitle(hotdogClassificationRecord)}
          </span>
          <Button
            variant="secondary"
            size="icon"
            aria-label={t('closeAriaLabel')}
            onClick={onClose}
            className="shrink-0"
          >
            <CloseIcon />
          </Button>
        </div>
      }
    >
      {hotdogClassificationRecord && (
        <HotdogClassificationDetailView
          key={hotdogClassificationRecord.id}
          hotdogClassificationRecord={hotdogClassificationRecord}
          onDeletionRequest={onDeletionRequest}
        />
      )}
    </Drawer>
  );
};

export default HotdogClassificationDetailDrawer;
