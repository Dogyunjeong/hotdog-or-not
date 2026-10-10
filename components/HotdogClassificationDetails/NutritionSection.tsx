import { HotdogTypes } from '@/shared/types';

import StatTable from '@/components/primitives/StatTable';

import DetailSection from './DetailSection';
import {
  formatHotdogNutritionValue,
  HOTDOG_NUTRITION_METRIC_LABEL,
  NUTRIENT_COLUMN_LABEL,
} from './detailsFormat';

export interface NutritionColumn {
  label: string;
  nutrition: HotdogTypes.HotdogNutrition;
}

interface NutritionSectionProps {
  columnList: NutritionColumn[];
  className?: string;
}

const NutritionSection = ({ columnList, className }: NutritionSectionProps) => {
  return (
    <DetailSection title="Nutrition" className={className}>
      <StatTable
        caption="Estimated nutrition"
        columnHeaderList={['', ...columnList.map(({ label }) => label)]}
        rowHeaderLabel={NUTRIENT_COLUMN_LABEL}
        rowList={HotdogTypes.HOTDOG_NUTRITION_METRIC_LIST.map((metric) => ({
          header: HOTDOG_NUTRITION_METRIC_LABEL[metric],
          cellList: columnList.map(({ nutrition }) => ({
            value: formatHotdogNutritionValue(metric, nutrition[metric]),
          })),
        }))}
      />
      <p className="text-xs text-foreground-muted">
        Rough estimates from a photo — not dietary advice.
      </p>
    </DetailSection>
  );
};

export default NutritionSection;
