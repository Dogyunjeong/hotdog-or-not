import { HotdogTypes } from '@/shared/types';
import { useFormatter, useTranslations } from 'next-intl';

export const DECIMAL_NUMBER_FORMAT_OPTIONS = { maximumFractionDigits: 1 };

/** Locale-aware nutrition labels and values: "≈ 290 kcal", "12 g", "810 mg". */
export const useHotdogNutritionFormat = () => {
  const t = useTranslations('details');
  const format = useFormatter();

  const getNutrientColumnLabel = () => {
    return t('nutrientColumn');
  };

  const getNutritionMetricLabel = (metric: HotdogTypes.HotdogNutritionMetric) => {
    return t(`nutritionMetric.${metric}`);
  };

  const formatNutritionValue = (metric: HotdogTypes.HotdogNutritionMetric, value: number) => {
    const formattedValue = format.number(value, DECIMAL_NUMBER_FORMAT_OPTIONS);

    switch (metric) {
      case 'caloriesKcal':
        return t('nutritionValue.caloriesKcal', { value: formattedValue });
      case 'proteinG':
      case 'fatG':
      case 'carbsG':
        return t('nutritionValue.grams', { value: formattedValue });
      case 'sodiumMg':
        return t('nutritionValue.milligrams', { value: formattedValue });
    }
  };

  return { getNutrientColumnLabel, getNutritionMetricLabel, formatNutritionValue };
};
