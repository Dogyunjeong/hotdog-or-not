import type { HotdogTypes } from '@/shared/types';
import { useTranslations } from 'next-intl';

import HotdogOriginSection from './HotdogOriginSection';
import HotdogStyleSection from './HotdogStyleSection';
import HotdogTastinessSection from './HotdogTastinessSection';
import IngredientListSection from './IngredientListSection';
import NutritionSection, { type NutritionColumn } from './NutritionSection';

const FULL_WIDTH_SECTION_CLASS_NAME = '@lg:col-span-2';

interface HotdogDetailsProps {
  hotdogDetails: HotdogTypes.HotdogDetails;
}

/** Two columns once the surrounding container is wide enough (inline under a wide verdict). */
const HotdogDetails = ({ hotdogDetails }: HotdogDetailsProps) => {
  const t = useTranslations('details');

  /** One column per hotdog; a second "All {n}" column when there are several. */
  const getNutritionColumnList = (): NutritionColumn[] => {
    const { hotdogCount, nutritionPerHotdog, nutritionTotal } = hotdogDetails;
    const perHotdogColumn = { label: t('nutrition.perHotdog'), nutrition: nutritionPerHotdog };

    if (hotdogCount > 1) {
      return [
        perHotdogColumn,
        { label: t('nutrition.allHotdogs', { count: hotdogCount }), nutrition: nutritionTotal },
      ];
    }
    return [perHotdogColumn];
  };

  return (
    <div className="grid grid-cols-1 gap-4 @lg:grid-cols-2">
      <HotdogTastinessSection
        tastiness={hotdogDetails.tastiness}
        className={FULL_WIDTH_SECTION_CLASS_NAME}
      />
      <HotdogStyleSection
        hotdogStyle={hotdogDetails.hotdogStyle}
        hotdogCount={hotdogDetails.hotdogCount}
      />
      <HotdogOriginSection origin={hotdogDetails.origin} />
      {hotdogDetails.ingredientList.length > 0 && (
        <IngredientListSection
          ingredientList={hotdogDetails.ingredientList}
          className={FULL_WIDTH_SECTION_CLASS_NAME}
        />
      )}
      <NutritionSection
        columnList={getNutritionColumnList()}
        className={FULL_WIDTH_SECTION_CLASS_NAME}
      />
    </div>
  );
};

export default HotdogDetails;
