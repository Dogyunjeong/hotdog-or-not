import { useTranslations } from 'next-intl';

/** Results saved before v0.3 have no details. */
const LegacyDetailsNotice = () => {
  const t = useTranslations('details');

  return <p className="text-sm text-foreground-muted">{t('legacyNotice')}</p>;
};

export default LegacyDetailsNotice;
