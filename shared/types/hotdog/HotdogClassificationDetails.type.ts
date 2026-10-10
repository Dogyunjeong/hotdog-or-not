/** All nutrition values are rough per-serving estimates. */
export interface HotdogNutrition {
  caloriesKcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  sodiumMg: number;
}

export type HotdogNutritionMetric = keyof HotdogNutrition;

/** Display and comparison order of the nutrition metrics. */
export const HOTDOG_NUTRITION_METRIC_LIST: HotdogNutritionMetric[] = [
  'caloriesKcal',
  'proteinG',
  'fatG',
  'carbsG',
  'sodiumMg',
];

/** Tastiness scores (overall and per aspect) run from 0 to this. */
export const HOTDOG_SCORE_MAX = 10;

export type HotdogTastinessAspect = 'bun' | 'sausage' | 'toppings' | 'presentation';

export interface HotdogTastiness {
  /** 0–10. */
  score: number;
  /** One funny line summing up the score. */
  headline: string;
  breakdown: { aspect: HotdogTastinessAspect; score: number; comment: string }[];
}

export type HotdogOriginSource = 'photoLocation' | 'styleGuess';

export interface HotdogOrigin {
  /** `photoLocation`: reverse-geocoded from the photo's GPS (city/region only). */
  source: HotdogOriginSource;
  /** e.g. "Chicago, Illinois, United States". Never coordinates. */
  placeName: string;
  /** Short explanation, e.g. why the style points to this place. */
  note: string;
}

export interface HotdogDetails {
  kind: 'hotdog';
  hotdogCount: number;
  hotdogStyle: { name: string; description: string };
  tastiness: HotdogTastiness;
  ingredientList: string[];
  nutritionPerHotdog: HotdogNutrition;
  nutritionTotal: HotdogNutrition;
  origin: HotdogOrigin;
}

export type HotdogComparisonWinner = 'hotdog' | 'subject' | 'tie';

export interface HotdogNutritionComparison {
  /** Winners are computed on the server from the numbers, not by the model. */
  metricList: {
    metric: HotdogNutritionMetric;
    hotdogValue: number;
    subjectValue: number;
    winner: HotdogComparisonWinner;
  }[];
  overallWinner: HotdogComparisonWinner;
  /** Funny one-liner from the model. */
  verdictLine: string;
}

export interface NotHotdogDetails {
  kind: 'notHotdog';
  subject: { name: string; description: string };
  isFood: boolean;
  /** `null` when the subject isn't food. */
  nutrition: HotdogNutrition | null;
  /** `null` when the subject isn't food. */
  hotdogComparison: HotdogNutritionComparison | null;
}

export type HotdogClassificationDetails = HotdogDetails | NotHotdogDetails;

/** Bump when the stored `details` shape changes; readers must handle every older version. */
export const HOTDOG_CLASSIFICATION_DETAILS_SCHEMA_VERSION = 1;
