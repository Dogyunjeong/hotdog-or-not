import type { HotdogTypes } from '@/shared/types';

import Card from '@/components/primitives/Card';

import HotdogClassificationHistoryThumbnail from './HotdogClassificationHistoryThumbnail';

const HOTDOG_CLASSIFICATION_DATE_FORMAT = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
});

const HotdogClassificationVerdictBadge = ({ isHotdog }: { isHotdog: boolean }) => {
  const verdictBadgeClassName = isHotdog
    ? 'bg-hotdog-yes-soft text-hotdog-yes-soft-foreground'
    : 'bg-hotdog-no-soft text-hotdog-no-soft-foreground';

  return (
    <span className={`rounded-control px-2 py-0.5 text-xs font-semibold ${verdictBadgeClassName}`}>
      {isHotdog ? 'Hotdog' : 'Not hotdog'}
    </span>
  );
};

interface HotdogClassificationHistoryItemProps {
  hotdogClassificationRecord: HotdogTypes.HotdogClassificationRecord;
  isNewHotdogClassification: boolean;
}

const HotdogClassificationHistoryItem = ({
  hotdogClassificationRecord,
  isNewHotdogClassification,
}: HotdogClassificationHistoryItemProps) => {
  const { isHotdog, reason, imageUrl, createdAt } = hotdogClassificationRecord;
  const createdAtLabel = HOTDOG_CLASSIFICATION_DATE_FORMAT.format(new Date(createdAt));

  return (
    <Card
      as="li"
      padding="sm"
      className={`flex items-start gap-3 ${isNewHotdogClassification ? 'motion-safe:animate-history-item-enter' : ''}`}
    >
      <HotdogClassificationHistoryThumbnail imageUrl={imageUrl} createdAtLabel={createdAtLabel} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
          <HotdogClassificationVerdictBadge isHotdog={isHotdog} />
          <time dateTime={createdAt} className="text-xs text-foreground-muted">
            {createdAtLabel}
          </time>
        </div>
        <p className="line-clamp-2 text-sm text-foreground-muted">{reason}</p>
      </div>
    </Card>
  );
};

export default HotdogClassificationHistoryItem;
