import type { HotdogTypes } from '@/shared/types';
import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

/** Cheap vision-capable tier; a hotdog check doesn't need a frontier model. */
export const HOTDOG_CLASSIFICATION_MODEL = 'gpt-5.4-mini';

export const HOTDOG_TASTINESS_ASPECT_LIST = [
  'bun',
  'sausage',
  'toppings',
  'presentation',
] as const satisfies readonly HotdogTypes.HotdogTastinessAspect[];

const HOTDOG_CLASSIFICATION_BASE_INSTRUCTIONS = `You are the judge of a "Hotdog or Not Hotdog" app.
Look at the image and fill in every field of the response.

## Verdict
A hotdog is a sausage (frankfurter, wiener, bratwurst, etc.) served in a sliced bun. Toppings are fine.
Photos, drawings, and toys of a hotdog count as a hotdog.
Everything else is not a hotdog, including a sausage without a bun or a bun without a sausage.
- isHotdog: your verdict. Use details.kind "hotdog" when isHotdog is true and "notHotdog" when it is false.
- reason: one short, friendly sentence a user would enjoy reading.

## When it is a hotdog (kind "hotdog")
- hotdogCount: how many hotdogs you can see (at least 1).
- hotdogStyle: the closest known style (e.g. "Chicago-style", "New York street dog", "Sonoran", "Danish pølse", "Classic ballpark dog") and one sentence on what makes it that style.
- tastiness: how tasty it looks. score from 0 to 10 (one decimal is fine), a funny but kind one-line headline, and exactly one breakdown entry for each aspect (bun, sausage, toppings, presentation) with its own 0-10 score and a short playful comment. Tease the food, never the person who made or photographed it.
- ingredientList: ingredients you can see or the style clearly implies, short lowercase names, most prominent first. Empty if you can't tell.
- nutritionPerHotdog: an honest estimate for ONE hotdog as pictured (bun, sausage and visible toppings). Use typical values for similar foods; don't nudge the numbers to make it look healthier or worse.
- originGuess: where this style comes from — placeName as "City, Region, Country" or "Region, Country", and note as one short sentence on why the style points there. Judge only from the food; you don't know where the photo was taken.

## When it is not a hotdog (kind "notHotdog")
- subject: a short name for the main thing in the image (e.g. "Pepperoni pizza", "Golden retriever") and one sentence describing it.
- isFood: whether the subject is something people eat.
- nutrition: if isFood, an honest estimate for one typical serving as pictured; otherwise null.
- verdictLine: if isFood, one funny line about a showdown between it and a hotdog, without naming a nutrition winner (the app works that out from the numbers); otherwise null.

All nutrition values: caloriesKcal in kcal, proteinG / fatG / carbsG in grams, sodiumMg in milligrams.
Keep every text short, plain, and kind. Never comment on people's looks or identity, or on where the photo was taken.`;

const OUTPUT_LANGUAGE_NAME: Record<HotdogTypes.HotdogClassificationLocale, string> = {
  en: 'English',
  ko: 'Korean',
};

/** Only the prose changes language; JSON keys and enum values (kind, aspect) stay English. */
export const createHotdogClassificationInstructions = (
  locale: HotdogTypes.HotdogClassificationLocale,
) => {
  return `${HOTDOG_CLASSIFICATION_BASE_INSTRUCTIONS}

## Language
Write reason and every free-text field (style and subject names and descriptions, headline, comments, ingredient names, origin placeName and note, verdictLine) in ${OUTPUT_LANGUAGE_NAME[locale]}.
Keep JSON keys and enum values (kind, aspect) exactly as specified, in English.`;
};

const hotdogNutritionSchema = z.object({
  caloriesKcal: z.number(),
  proteinG: z.number(),
  fatG: z.number(),
  carbsG: z.number(),
  sodiumMg: z.number(),
});

/** Strict structured outputs: every field is required (`nullable` instead of optional). */
const hotdogModelDetailsSchema = z.object({
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
  originGuess: z.object({ placeName: z.string(), note: z.string() }),
});

const notHotdogModelDetailsSchema = z.object({
  kind: z.literal('notHotdog'),
  subject: z.object({ name: z.string(), description: z.string() }),
  isFood: z.boolean(),
  nutrition: hotdogNutritionSchema.nullable(),
  verdictLine: z.string().nullable(),
});

/**
 * What the model returns. The server finishes the details: it clamps the numbers, picks the
 * origin (photo location or this style guess), computes total nutrition and comparison winners.
 */
const hotdogClassificationModelOutputSchema = z.object({
  isHotdog: z.boolean(),
  reason: z.string(),
  details: z.discriminatedUnion('kind', [hotdogModelDetailsSchema, notHotdogModelDetailsSchema]),
});

export type HotdogModelDetails = z.infer<typeof hotdogModelDetailsSchema>;
export type NotHotdogModelDetails = z.infer<typeof notHotdogModelDetailsSchema>;
export type HotdogClassificationModelOutput = z.infer<typeof hotdogClassificationModelOutputSchema>;

export const HOTDOG_CLASSIFICATION_TEXT_FORMAT = zodTextFormat(
  hotdogClassificationModelOutputSchema,
  'hotdog_classification',
);
