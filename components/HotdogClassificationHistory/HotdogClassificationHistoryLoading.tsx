import Card from '@/components/primitives/Card';
import Skeleton from '@/components/primitives/Skeleton';

const HOTDOG_CLASSIFICATION_HISTORY_SKELETON_ROW_KEY_LIST = ['first', 'second', 'third'];

const HotdogClassificationHistoryLoading = () => {
  return (
    <div>
      <p className="sr-only">Loading your history…</p>
      <ul aria-hidden className="flex flex-col gap-3">
        {HOTDOG_CLASSIFICATION_HISTORY_SKELETON_ROW_KEY_LIST.map((skeletonRowKey) => (
          <Card key={skeletonRowKey} as="li" padding="sm" className="flex items-center gap-3">
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
