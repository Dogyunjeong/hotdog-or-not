import type { HotdogTypes } from '@/shared/types';
import { z } from 'zod';

import { HOTDOG_TASTINESS_ASPECT_LIST } from './HotdogClassification.prompt';

const hotdogNutritionSchema = z.object({
  caloriesKcal: z.number(),
  proteinG: z.number(),
  fatG: z.number(),
  carbsG: z.number(),
  sodiumMg: z.number(),
});

const hotdogComparisonWinnerSchema = z.enum(['hotdog', 'subject', 'tie']);

const hotdogDetailsSchema = z.object({
  kind: z.literal('hotdog'),
  hotdogCount: z.number(),
  hotdogStyle: z.object({ name: z.string(), description: z.string() }),
  tastiness: z.object({
    score: z.number(),
    headline: z.string(),
    breakdown: z.array(
      z.object({
        aspect: z.enum(HOTDOG_TASTINESS_ASPECT_LIST),
        score: z.number(),
        comment: z.string(),
      }),
    ),
  }),
  ingredientList: z.array(z.string()),
  nutritionPerHotdog: hotdogNutritionSchema,
  nutritionTotal: hotdogNutritionSchema,
  origin: z.object({
    source: z.enum(['photoLocation', 'styleGuess']),
    placeName: z.string(),
    note: z.string(),
  }),
});

const notHotdogDetailsSchema = z.object({
  kind: z.literal('notHotdog'),
  subject: z.object({ name: z.string(), description: z.string() }),
  isFood: z.boolean(),
  nutrition: hotdogNutritionSchema.nullable(),
  hotdogComparison: z
    .object({
      metricList: z.array(
        z.object({
          metric: hotdogNutritionSchema.keyof(),
          hotdogValue: z.number(),
          subjectValue: z.number(),
          winner: hotdogComparisonWinnerSchema,
        }),
      ),
      overallWinner: hotdogComparisonWinnerSchema,
      verdictLine: z.string(),
    })
    .nullable(),
});

/**
 * Stored `details` of schema version 1 (`HotdogTypes.HotdogClassificationDetails`), checked
 * on read so a malformed row renders verdict-only instead of breaking the page.
 */
export const hotdogClassificationDetailsV1Schema: z.ZodType<HotdogTypes.HotdogClassificationDetails> =
  z.discriminatedUnion('kind', [hotdogDetailsSchema, notHotdogDetailsSchema]);
