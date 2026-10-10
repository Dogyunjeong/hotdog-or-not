import { HotdogTypes } from '@/shared/types';
import { useTranslations } from 'next-intl';

import StatTable from '@/components/primitives/StatTable';

import DetailSection from './DetailSection';
import { useHotdogNutritionFormat } from './detailsFormat';

export interface NutritionColumn {
  label: string;
  nutrition: HotdogTypes.HotdogNutrition;
}

interface NutritionSectionProps {
  columnList: NutritionColumn[];
  className?: string;
}

const NutritionSection = ({ columnList, className }: NutritionSectionProps) => {
  const t = useTranslations('details');
  const { getNutrientColumnLabel, getNutritionMetricLabel, formatNutritionValue } =
    useHotdogNutritionFormat();

  return (
    <DetailSection title={t('nutrition.title')} className={className}>
      <StatTable
        caption={t('nutrition.caption')}
        columnHeaderList={['', ...columnList.map(({ label }) => label)]}
        rowHeaderLabel={getNutrientColumnLabel()}
        rowList={HotdogTypes.HOTDOG_NUTRITION_METRIC_LIST.map((metric) => ({
          header: getNutritionMetricLabel(metric),
          cellList: columnList.map(({ nutrition }) => ({
            value: formatNutritionValue(metric, nutrition[metric]),
          })),
        }))}
      />
      <p className="text-xs text-foreground-muted">{t('nutrition.disclaimer')}</p>
    </DetailSection>
  );
};

export default NutritionSection;
