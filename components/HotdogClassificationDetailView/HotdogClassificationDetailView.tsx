'use client';

import type { SavedHotdogClassificationRecord } from '@/hooks/useHotdogClassificationHistory';

import HotdogClassificationDetails from '@/components/HotdogClassificationDetails/HotdogClassificationDetails';
import HotdogClassificationPhoto from '@/components/HotdogClassificationHistory/HotdogClassificationPhoto';
import HotdogClassificationVerdictBadge from '@/components/HotdogClassificationHistory/HotdogClassificationVerdictBadge';
import {
  formatHotdogClassificationCreatedAt,
  getHotdogClassificationDetailTitle,
} from '@/components/HotdogClassificationHistory/hotdogClassificationLabel';
import Button from '@/components/primitives/Button';

/** Only one detail view is shown at a time (panel or drawer), so one id names it. */
export const HOTDOG_CLASSIFICATION_DETAIL_HEADING_ID = 'hotdog-classification-detail-heading';

interface HotdogClassificationDetailViewProps {
  hotdogClassificationRecord: SavedHotdogClassificationRecord;
  /** Opens the delete confirmation (owned by the workspace so it survives a resize). */
  onDeletionRequest: (hotdogClassificationId: string) => void;
}

/** One saved result in full; the same content in the desktop panel and the mobile drawer. */
const HotdogClassificationDetailView = ({
  hotdogClassificationRecord,
  onDeletionRequest,
}: HotdogClassificationDetailViewProps) => {
  const { id, isHotdog, reason, originalImageUrl, createdAt, details } = hotdogClassificationRecord;

  return (
    <div className="flex flex-col gap-4 motion-safe:animate-status-enter">
      <HotdogClassificationPhoto
        imageUrl={originalImageUrl}
        size="hero"
        photoDescription={`Your photo from ${formatHotdogClassificationCreatedAt(createdAt)}`}
      />
      <div className="flex flex-col gap-2">
        <h2
          id={HOTDOG_CLASSIFICATION_DETAIL_HEADING_ID}
          tabIndex={-1}
          className="text-xl font-bold tracking-tight outline-none"
        >
          {getHotdogClassificationDetailTitle(hotdogClassificationRecord)}
        </h2>
        {/* The heading already names the verdict. */}
        <div aria-hidden>
          <HotdogClassificationVerdictBadge isHotdog={isHotdog} />
        </div>
        <p className="text-foreground-muted">{reason}</p>
      </div>
      <HotdogClassificationDetails details={details} />
      <Button variant="secondary" onClick={() => onDeletionRequest(id)} className="self-start">
        Delete this photo
      </Button>
    </div>
  );
};

export default HotdogClassificationDetailView;
