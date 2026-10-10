import type { SavedHotdogClassificationRecord } from '@/hooks/useHotdogClassificationHistory';

import { FOCUS_RING_CLASS_NAME } from '@/components/primitives/focusRing';

import HotdogClassificationHistoryItemTitle from './HotdogClassificationHistoryItemTitle';
import HotdogClassificationPhoto from './HotdogClassificationPhoto';
import HotdogClassificationVerdictBadge from './HotdogClassificationVerdictBadge';
import { useHotdogClassificationLabel } from './hotdogClassificationLabel';

/** DOM id of a card's button, so focus can return to it after the details close. */
export const getHotdogClassificationHistoryItemElementId = (hotdogClassificationId: string) => {
  return `hotdog-classification-history-item-${hotdogClassificationId}`;
};

interface HotdogClassificationHistoryItemProps {
  hotdogClassificationRecord: SavedHotdogClassificationRecord;
  isNewHotdogClassification: boolean;
  onHotdogClassificationSelect: (hotdogClassificationId: string) => void;
}

const HotdogClassificationHistoryItem = ({
  hotdogClassificationRecord,
  isNewHotdogClassification,
  onHotdogClassificationSelect,
}: HotdogClassificationHistoryItemProps) => {
  const { formatHotdogClassificationCreatedAt } = useHotdogClassificationLabel();
  const { id, isHotdog, thumbnailImageUrl, createdAt } = hotdogClassificationRecord;

  return (
    <li className={isNewHotdogClassification ? 'motion-safe:animate-history-item-enter' : ''}>
      <button
        type="button"
        id={getHotdogClassificationHistoryItemElementId(id)}
        onClick={() => onHotdogClassificationSelect(id)}
        className={`flex w-full items-start gap-3 rounded-card border border-border bg-surface p-3 text-left transition-colors hover:bg-surface-muted ${FOCUS_RING_CLASS_NAME}`}
      >
        <HotdogClassificationPhoto imageUrl={thumbnailImageUrl} size="thumb" />
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="line-clamp-2 text-sm font-medium break-words">
            <HotdogClassificationHistoryItemTitle
              hotdogClassificationRecord={hotdogClassificationRecord}
            />
          </span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <HotdogClassificationVerdictBadge isHotdog={isHotdog} />
            <time dateTime={createdAt} className="text-xs text-foreground-muted">
              {formatHotdogClassificationCreatedAt(createdAt)}
            </time>
          </span>
        </span>
      </button>
    </li>
  );
};

export default HotdogClassificationHistoryItem;
