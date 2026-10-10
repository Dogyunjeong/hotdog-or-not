import { HotdogTypes } from '@/shared/types';

import { compareNutritionWithAverageHotdog } from './compareNutritionWithAverageHotdog';
import {
  HOTDOG_TASTINESS_ASPECT_LIST,
  type HotdogClassificationModelOutput,
  type HotdogModelDetails,
  type NotHotdogModelDetails,
} from './HotdogClassification.prompt';

/** A photo never shows more; anything above is a model glitch. */
const HOTDOG_COUNT_MAX = 20;

/** Upper bounds for one serving, far above any real food, so a model glitch can't render absurd numbers. */
const HOTDOG_NUTRITION_PER_SERVING_MAX: HotdogTypes.HotdogNutrition = {
  caloriesKcal: 5000,
  proteinG: 500,
  fatG: 500,
  carbsG: 500,
  sodiumMg: 20000,
};

/** When the model skipped its joke, the comparison still shows with a neutral lead. */
const DEFAULT_COMPARISON_VERDICT_LINE = "Here's how it stacks up against an average hotdog.";

const roundToDecimalPlaces = (value: number, decimalPlaces: number) => {
  const decimalFactor = 10 ** decimalPlaces;
  return Math.round(value * decimalFactor) / decimalFactor;
};

/** Model numbers aren't trusted: clamped to 0..max, and non-finite values become 0. */
const toBoundedNumber = (value: number, maxValue: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(maxValue, Math.max(0, value));
};

const toHotdogScore = (score: number) => {
  return roundToDecimalPlaces(toBoundedNumber(score, HotdogTypes.HOTDOG_SCORE_MAX), 1);
};

/** kcal and mg as whole numbers, grams with one decimal — the precision the UI shows. */
const roundHotdogNutrition = (
  nutrition: HotdogTypes.HotdogNutrition,
): HotdogTypes.HotdogNutrition => {
  return {
    caloriesKcal: Math.round(nutrition.caloriesKcal),
    proteinG: roundToDecimalPlaces(nutrition.proteinG, 1),
    fatG: roundToDecimalPlaces(nutrition.fatG, 1),
    carbsG: roundToDecimalPlaces(nutrition.carbsG, 1),
    sodiumMg: Math.round(nutrition.sodiumMg),
  };
};

/** One serving, clamped to sane bounds and rounded. */
const toHotdogNutrition = (nutrition: HotdogTypes.HotdogNutrition): HotdogTypes.HotdogNutrition => {
  const toBoundedMetric = (metric: HotdogTypes.HotdogNutritionMetric) =>
    toBoundedNumber(nutrition[metric], HOTDOG_NUTRITION_PER_SERVING_MAX[metric]);
  return roundHotdogNutrition({
    caloriesKcal: toBoundedMetric('caloriesKcal'),
    proteinG: toBoundedMetric('proteinG'),
    fatG: toBoundedMetric('fatG'),
    carbsG: toBoundedMetric('carbsG'),
    sodiumMg: toBoundedMetric('sodiumMg'),
  });
};

/** Multiplies the already-rounded serving, so the total matches what the per-hotdog column shows. */
const multiplyHotdogNutrition = (
  servingNutrition: HotdogTypes.HotdogNutrition,
  servingCount: number,
): HotdogTypes.HotdogNutrition => {
  return roundHotdogNutrition({
    caloriesKcal: servingNutrition.caloriesKcal * servingCount,
    proteinG: servingNutrition.proteinG * servingCount,
    fatG: servingNutrition.fatG * servingCount,
    carbsG: servingNutrition.carbsG * servingCount,
    sodiumMg: servingNutrition.sodiumMg * servingCount,
  });
};

/** One entry per aspect in a fixed order; duplicates are dropped, missing aspects are left out. */
const toHotdogTastinessBreakdown = (
  breakdown: HotdogModelDetails['tastiness']['breakdown'],
): HotdogTypes.HotdogTastiness['breakdown'] => {
  return HOTDOG_TASTINESS_ASPECT_LIST.flatMap((aspect) => {
    const aspectEntry = breakdown.find((breakdownEntry) => breakdownEntry.aspect === aspect);

    if (!aspectEntry) {
      return [];
    }
    return [{ aspect, score: toHotdogScore(aspectEntry.score), comment: aspectEntry.comment }];
  });
};

/** The photo's own location beats the model's guess from the style. */
const toHotdogOrigin = ({
  originGuess,
  photoPlaceName,
}: {
  originGuess: HotdogModelDetails['originGuess'];
  photoPlaceName?: string;
}): HotdogTypes.HotdogOrigin => {
  if (photoPlaceName) {
    const styleOriginPlaceName = originGuess.placeName.trim();
    return {
      source: 'photoLocation',
      placeName: photoPlaceName,
      note: styleOriginPlaceName ? `Style-wise, it's a nod to ${styleOriginPlaceName}.` : '',
    };
  }
  return { source: 'styleGuess', placeName: originGuess.placeName, note: originGuess.note };
};

const buildHotdogDetails = ({
  hotdogModelDetails,
  photoPlaceName,
}: {
  hotdogModelDetails: HotdogModelDetails;
  photoPlaceName?: string;
}): HotdogTypes.HotdogDetails => {
  // A hotdog verdict means at least one hotdog, whatever the model counted.
  const hotdogCount = Math.max(
    1,
    Math.round(toBoundedNumber(hotdogModelDetails.hotdogCount, HOTDOG_COUNT_MAX)),
  );

  const nutritionPerHotdog = toHotdogNutrition(hotdogModelDetails.nutritionPerHotdog);

  return {
    kind: 'hotdog',
    hotdogCount,
    hotdogStyle: hotdogModelDetails.hotdogStyle,
    tastiness: {
      score: toHotdogScore(hotdogModelDetails.tastiness.score),
      headline: hotdogModelDetails.tastiness.headline,
      breakdown: toHotdogTastinessBreakdown(hotdogModelDetails.tastiness.breakdown),
    },
    ingredientList: hotdogModelDetails.ingredientList.filter((ingredient) => ingredient.trim()),
    nutritionPerHotdog,
    // Computed, not asked for: the total always matches the per-hotdog numbers.
    nutritionTotal: multiplyHotdogNutrition(nutritionPerHotdog, hotdogCount),
    origin: toHotdogOrigin({ originGuess: hotdogModelDetails.originGuess, photoPlaceName }),
  };
};

/**
 * Nutrition and the hotdog comparison only exist for food the model could estimate;
 * a missing joke doesn't hide the comparison.
 */
const buildNotHotdogDetails = (
  notHotdogModelDetails: NotHotdogModelDetails,
): HotdogTypes.NotHotdogDetails => {
  const { subject, isFood, nutrition: modelNutrition, verdictLine } = notHotdogModelDetails;
  const nutrition = isFood && modelNutrition ? toHotdogNutrition(modelNutrition) : null;

  if (!nutrition) {
    return { kind: 'notHotdog', subject, isFood, nutrition, hotdogComparison: null };
  }
  return {
    kind: 'notHotdog',
    subject,
    isFood,
    nutrition,
    hotdogComparison: compareNutritionWithAverageHotdog({
      subjectNutrition: nutrition,
      verdictLine: verdictLine?.trim() || DEFAULT_COMPARISON_VERDICT_LINE,
    }),
  };
};

/**
 * Turns the model's answer into stored details (schema v1). `photoPlaceName` is the
 * reverse-geocoded photo location, used only for hotdogs.
 */
export const buildHotdogClassificationDetails = ({
  modelDetails,
  photoPlaceName,
}: {
  modelDetails: HotdogClassificationModelOutput['details'];
  photoPlaceName?: string;
}): HotdogTypes.HotdogClassificationDetails => {
  switch (modelDetails.kind) {
    case 'hotdog':
      return buildHotdogDetails({ hotdogModelDetails: modelDetails, photoPlaceName });
    case 'notHotdog':
      return buildNotHotdogDetails(modelDetails);
  }
};
