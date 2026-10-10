import { HotdogTypes } from '@/shared/types';

const decimalNumberFormat = new Intl.NumberFormat('en', { maximumFractionDigits: 1 });

/** "8.5/10" — pair with `formatHotdogScoreForScreenReader` for an unambiguous reading. */
export const formatHotdogScore = (score: number) => {
  return `${decimalNumberFormat.format(score)}/${HotdogTypes.HOTDOG_SCORE_MAX}`;
};

export const formatHotdogScoreForScreenReader = (score: number) => {
  return `${decimalNumberFormat.format(score)} out of ${HotdogTypes.HOTDOG_SCORE_MAX}`;
};

export const HOTDOG_TASTINESS_ASPECT_LABEL: Record<HotdogTypes.HotdogTastinessAspect, string> = {
  bun: 'Bun',
  sausage: 'Sausage',
  toppings: 'Toppings',
  presentation: 'Presentation',
};

/** Screen-reader label of the nutrition tables' row-header column (visually empty). */
export const NUTRIENT_COLUMN_LABEL = 'Nutrient';

export const HOTDOG_NUTRITION_METRIC_LABEL: Record<HotdogTypes.HotdogNutritionMetric, string> = {
  caloriesKcal: 'Calories',
  proteinG: 'Protein',
  fatG: 'Fat',
  carbsG: 'Carbs',
  sodiumMg: 'Sodium',
};

/** "≈ 290 kcal", "12 g", "810 mg". */
export const formatHotdogNutritionValue = (
  metric: HotdogTypes.HotdogNutritionMetric,
  value: number,
) => {
  const formattedValue = decimalNumberFormat.format(value);

  switch (metric) {
    case 'caloriesKcal':
      return `≈ ${formattedValue} kcal`;
    case 'proteinG':
    case 'fatG':
    case 'carbsG':
      return `${formattedValue} g`;
    case 'sodiumMg':
      return `${formattedValue} mg`;
  }
};

export const formatHotdogCount = (hotdogCount: number) => {
  if (hotdogCount === 1) {
    return '1 hotdog spotted';
  }
  return `${hotdogCount} hotdogs spotted`;
};
