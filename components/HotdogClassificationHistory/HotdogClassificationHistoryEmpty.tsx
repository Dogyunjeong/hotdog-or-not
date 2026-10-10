import { useTranslations } from 'next-intl';

import Card from '@/components/primitives/Card';

const HotdogClassificationHistoryEmpty = () => {
  const t = useTranslations('history');

  return (
    <Card className="flex flex-col items-center gap-2 text-center">
      <span aria-hidden className="text-3xl">
        🌭
      </span>
      <p className="font-medium">{t('empty.title')}</p>
      <p className="text-sm text-foreground-muted"> {t('empty.description')} </p>
    </Card>
  );
};

export default HotdogClassificationHistoryEmpty;
