import { useTranslations } from 'next-intl';

import { useApiErrorMessage } from '@/hooks/useApiErrorMessage';
import type { HotdogClassificationState } from '@/hooks/useHotdogClassification';

import HotdogClassificationFailure from './HotdogClassificationFailure';
import HotdogClassificationIdle from './HotdogClassificationIdle';
import HotdogClassificationProgress from './HotdogClassificationProgress';
import HotdogVerdict from './HotdogVerdict';

interface HotdogClassificationStatusProps {
  hotdogClassificationState: HotdogClassificationState;
  onRetry: () => void;
}

const HotdogClassificationStatusContent = ({
  hotdogClassificationState,
  onRetry,
}: HotdogClassificationStatusProps) => {
  const t = useTranslations('classifier.verdict');
  const getErrorMessage = useApiErrorMessage();

  switch (hotdogClassificationState.status) {
    case 'idle':
      return <HotdogClassificationIdle />;
    case 'uploading':
    case 'classifying':
      return <HotdogClassificationProgress step={hotdogClassificationState.status} />;
    case 'classified':
      return (
        <>
          <h2 className="sr-only">{t('heading')}</h2>
          <HotdogVerdict
            hotdogClassificationRecord={hotdogClassificationState.hotdogClassificationRecord}
          />
        </>
      );
    case 'failed':
      return (
        <HotdogClassificationFailure
          errorMessage={getErrorMessage({
            errorKey: hotdogClassificationState.errorKey,
            errorValues: hotdogClassificationState.errorValues,
          })}
          canRetry={hotdogClassificationState.canRetry}
          onRetry={onRetry}
        />
      );
  }
};

/** Always mounted, so screen readers announce every status change in place. */
const HotdogClassificationStatus = ({
  hotdogClassificationState,
  onRetry,
}: HotdogClassificationStatusProps) => {
  return (
    <div role="status" aria-live="polite">
      <div key={hotdogClassificationState.status} className="motion-safe:animate-status-enter">
        <HotdogClassificationStatusContent
          hotdogClassificationState={hotdogClassificationState}
          onRetry={onRetry}
        />
      </div>
    </div>
  );
};

export default HotdogClassificationStatus;
