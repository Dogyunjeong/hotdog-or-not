import { HotdogTypes } from '@/shared/types';

/**
 * Reference "average hotdog": one beef frank in a white bun, no toppings. An approximation
 * rounded from USDA FoodData Central values for a beef frankfurter (~45 g) plus a hotdog
 * bun (~45 g) — close enough for a playful comparison against photo-based estimates.
 */
export const AVERAGE_HOTDOG_NUTRITION: HotdogTypes.HotdogNutrition = {
  caloriesKcal: 290,
  proteinG: 11,
  fatG: 17,
  carbsG: 24,
  sodiumMg: 810,
};

/** Both sides are rough estimates, so values within 5% of each other are a tie. */
const NUTRITION_TIE_RELATIVE_DIFFERENCE = 0.05;

const isNutritionValueTie = (hotdogValue: number, subjectValue: number) => {
  const largerValue = Math.max(hotdogValue, subjectValue);

  if (largerValue === 0) {
    return true;
  }
  return Math.abs(hotdogValue - subjectValue) / largerValue <= NUTRITION_TIE_RELATIVE_DIFFERENCE;
};

/** More protein wins; less of everything else (calories, fat, carbs, sodium) wins. */
const getNutritionMetricWinner = ({
  metric,
  hotdogValue,
  subjectValue,
}: {
  metric: HotdogTypes.HotdogNutritionMetric;
  hotdogValue: number;
  subjectValue: number;
}): HotdogTypes.HotdogComparisonWinner => {
  if (isNutritionValueTie(hotdogValue, subjectValue)) {
    return 'tie';
  }

  const isHotdogValueHigher = hotdogValue > subjectValue;

  switch (metric) {
    case 'proteinG':
      return isHotdogValueHigher ? 'hotdog' : 'subject';
    case 'caloriesKcal':
    case 'fatG':
    case 'carbsG':
    case 'sodiumMg':
      return isHotdogValueHigher ? 'subject' : 'hotdog';
  }
};

/** Whoever wins more metrics wins overall. */
const getOverallComparisonWinner = (
  winnerList: HotdogTypes.HotdogComparisonWinner[],
): HotdogTypes.HotdogComparisonWinner => {
  const hotdogWinCount = winnerList.filter((winner) => winner === 'hotdog').length;
  const subjectWinCount = winnerList.filter((winner) => winner === 'subject').length;

  if (hotdogWinCount === subjectWinCount) {
    return 'tie';
  }
  return hotdogWinCount > subjectWinCount ? 'hotdog' : 'subject';
};

/** Winners come from the numbers here, never from the model. */
export const compareNutritionWithAverageHotdog = ({
  subjectNutrition,
  verdictLine,
}: {
  subjectNutrition: HotdogTypes.HotdogNutrition;
  verdictLine: string;
}): HotdogTypes.HotdogNutritionComparison => {
  const metricList = HotdogTypes.HOTDOG_NUTRITION_METRIC_LIST.map((metric) => {
    const hotdogValue = AVERAGE_HOTDOG_NUTRITION[metric];
    const subjectValue = subjectNutrition[metric];
    return {
      metric,
      hotdogValue,
      subjectValue,
      winner: getNutritionMetricWinner({ metric, hotdogValue, subjectValue }),
    };
  });

  return {
    metricList,
    overallWinner: getOverallComparisonWinner(metricList.map(({ winner }) => winner)),
    verdictLine,
  };
};
