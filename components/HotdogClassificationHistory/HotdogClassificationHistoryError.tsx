import { useTranslations } from 'next-intl';

import Button from '@/components/primitives/Button';
import InlineAlert from '@/components/primitives/InlineAlert';

interface HotdogClassificationHistoryErrorProps {
  onRetry: () => void;
}

const HotdogClassificationHistoryError = ({ onRetry }: HotdogClassificationHistoryErrorProps) => {
  const t = useTranslations('history');

  return (
    <InlineAlert
      message={t('error.message')}
      action={
        <Button variant="secondary" size="sm" onClick={onRetry}>
          {t('error.retry')}
        </Button>
      }
    />
  );
};

export default HotdogClassificationHistoryError;
