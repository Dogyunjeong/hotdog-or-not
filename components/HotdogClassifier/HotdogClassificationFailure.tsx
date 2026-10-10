import { useTranslations } from 'next-intl';

import Button from '@/components/primitives/Button';
import InlineAlert from '@/components/primitives/InlineAlert';

interface HotdogClassificationFailureProps {
  errorMessage: string;
  canRetry: boolean;
  onRetry: () => void;
}

const HotdogClassificationFailure = ({
  errorMessage,
  canRetry,
  onRetry,
}: HotdogClassificationFailureProps) => {
  const t = useTranslations('classifier.failure');

  return (
    <InlineAlert
      message={errorMessage}
      // Announced once by the surrounding polite status region.
      isLiveRegion={false}
      action={
        canRetry && (
          <Button variant="secondary" size="sm" onClick={onRetry}>
            {t('retry')}
          </Button>
        )
      }
    />
  );
};

export default HotdogClassificationFailure;
