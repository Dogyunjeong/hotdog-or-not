import { useTranslations } from 'next-intl';

const HotdogClassificationIdle = () => {
  const t = useTranslations('classifier');

  return <p className="text-center text-foreground-muted">{t('idle')}</p>;
};

export default HotdogClassificationIdle;
