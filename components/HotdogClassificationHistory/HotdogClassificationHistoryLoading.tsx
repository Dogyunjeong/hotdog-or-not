import Card from '@/components/primitives/Card';
import Skeleton from '@/components/primitives/Skeleton';

/** Three rows in one column; the fourth only fills out the two-column grid. */
const HOTDOG_CLASSIFICATION_HISTORY_SKELETON_ROW_LIST = [
  { skeletonRowKey: 'first', className: 'flex' },
  { skeletonRowKey: 'second', className: 'flex' },
  { skeletonRowKey: 'third', className: 'flex' },
  { skeletonRowKey: 'fourth', className: 'hidden sm:flex lg:hidden' },
];

interface HotdogClassificationHistoryLoadingProps {
  loadingMessage: string;
}

const HotdogClassificationHistoryLoading = ({
  loadingMessage,
}: HotdogClassificationHistoryLoadingProps) => {
  return (
    <div>
      <p className="sr-only">{loadingMessage}</p>
      <ul aria-hidden className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        {HOTDOG_CLASSIFICATION_HISTORY_SKELETON_ROW_LIST.map(({ skeletonRowKey, className }) => (
          <Card
            key={skeletonRowKey}
            as="li"
            padding="sm"
            className={`items-center gap-3 ${className}`}
          >
            <Skeleton className="size-14 shrink-0 rounded-thumb" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-24 rounded-control" />
              <Skeleton className="h-3 w-full rounded-control" />
            </div>
          </Card>
        ))}
      </ul>
    </div>
  );
};

export default HotdogClassificationHistoryLoading;
