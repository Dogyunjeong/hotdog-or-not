import type { HotdogTypes } from '@/shared/types';
import { useTranslations } from 'next-intl';

import DetailSection from './DetailSection';

interface HotdogStyleSectionProps {
  hotdogStyle: HotdogTypes.HotdogDetails['hotdogStyle'];
  hotdogCount: number;
}

const HotdogStyleSection = ({ hotdogStyle, hotdogCount }: HotdogStyleSectionProps) => {
  const t = useTranslations('details');

  return (
    <DetailSection title={t('style.title')}>
      <div className="flex flex-col gap-1">
        <p className="font-semibold">{hotdogStyle.name}</p>
        <p className="text-sm text-foreground-muted">{hotdogStyle.description}</p>
      </div>
      <p className="text-sm">{t('style.hotdogCount', { count: hotdogCount })}</p>
    </DetailSection>
  );
};

export default HotdogStyleSection;
