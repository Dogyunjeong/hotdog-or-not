import { describe, expect, it } from 'vitest';

import {
  HOTDOG_MODEL_OUTPUT,
  NOT_HOTDOG_FOOD_MODEL_OUTPUT,
} from '@/test/helpers/hotdogClassificationModelOutput';
import { buildHotdogClassificationDetails } from './buildHotdogClassificationDetails';
import type { HotdogModelDetails, NotHotdogModelDetails } from './HotdogClassification.prompt';

const hotdogModelDetails = HOTDOG_MODEL_OUTPUT.details as HotdogModelDetails;
const notHotdogFoodModelDetails = NOT_HOTDOG_FOOD_MODEL_OUTPUT.details as NotHotdogModelDetails;

describe('buildHotdogClassificationDetails', () => {
  it('computes comparison winners from the numbers against the average hotdog', () => {
    const details = buildHotdogClassificationDetails({ modelDetails: notHotdogFoodModelDetails });

    expect(details).toMatchObject({
      kind: 'notHotdog',
      hotdogComparison: {
        metricList: [
          { metric: 'caloriesKcal', hotdogValue: 290, subjectValue: 180, winner: 'subject' },
          { metric: 'proteinG', hotdogValue: 11, subjectValue: 6, winner: 'hotdog' },
          // 17 g vs 17.4 g is within the 5% tie band.
          { metric: 'fatG', hotdogValue: 17, subjectValue: 17.4, winner: 'tie' },
          { metric: 'carbsG', hotdogValue: 24, subjectValue: 10, winner: 'subject' },
          { metric: 'sodiumMg', hotdogValue: 810, subjectValue: 500, winner: 'subject' },
        ],
        overallWinner: 'subject',
        verdictLine: notHotdogFoodModelDetails.verdictLine,
      },
    });
  });

  it('skips nutrition and the comparison for things people do not eat', () => {
    const details = buildHotdogClassificationDetails({
      modelDetails: { ...notHotdogFoodModelDetails, isFood: false },
    });

    expect(details).toMatchObject({ isFood: false, nutrition: null, hotdogComparison: null });
  });

  it('keeps the comparison with a neutral lead when the model skipped its joke', () => {
    const details = buildHotdogClassificationDetails({
      modelDetails: { ...notHotdogFoodModelDetails, verdictLine: null },
    });

    expect(details).toMatchObject({
      hotdogComparison: {
        overallWinner: 'subject',
        verdictLine: "Here's how it stacks up against an average hotdog.",
      },
    });
  });

  it('clamps model numbers and derives the total from the per-hotdog estimate', () => {
    const details = buildHotdogClassificationDetails({
      modelDetails: {
        ...hotdogModelDetails,
        hotdogCount: 2.2,
        tastiness: {
          ...hotdogModelDetails.tastiness,
          score: 14,
          breakdown: [
            { aspect: 'sausage', score: -3, comment: 'Mystery meat.' },
            { aspect: 'bun', score: 7.25, comment: 'Soft.' },
            { aspect: 'bun', score: 1, comment: 'Duplicate.' },
          ],
        },
        nutritionPerHotdog: {
          caloriesKcal: 300.4,
          proteinG: -1,
          fatG: 18,
          carbsG: 25,
          sodiumMg: 900,
        },
      },
    });

    expect(details).toMatchObject({
      hotdogCount: 2,
      tastiness: {
        score: 10,
        breakdown: [
          { aspect: 'bun', score: 7.3, comment: 'Soft.' },
          { aspect: 'sausage', score: 0, comment: 'Mystery meat.' },
        ],
      },
      nutritionPerHotdog: { caloriesKcal: 300, proteinG: 0, fatG: 18, carbsG: 25, sodiumMg: 900 },
      // Per-hotdog values are rounded first, so 300 kcal × 2 shows as 600, not 601.
      nutritionTotal: { caloriesKcal: 600, proteinG: 0, fatG: 36, carbsG: 50, sodiumMg: 1800 },
    });
  });

  it('caps absurd model numbers at sane upper bounds', () => {
    const details = buildHotdogClassificationDetails({
      modelDetails: {
        ...hotdogModelDetails,
        hotdogCount: 1_000_000,
        nutritionPerHotdog: {
          caloriesKcal: 1e9,
          proteinG: 9000,
          fatG: 9000,
          carbsG: 9000,
          sodiumMg: 1e9,
        },
      },
    });

    expect(details).toMatchObject({
      hotdogCount: 20,
      nutritionPerHotdog: {
        caloriesKcal: 5000,
        proteinG: 500,
        fatG: 500,
        carbsG: 500,
        sodiumMg: 20000,
      },
    });
  });

  it('prefers the photo location over the style guess for the origin', () => {
    expect(
      buildHotdogClassificationDetails({
        modelDetails: hotdogModelDetails,
        photoPlaceName: 'London, England, United Kingdom',
      }),
    ).toMatchObject({
      origin: { source: 'photoLocation', placeName: 'London, England, United Kingdom' },
    });
    expect(buildHotdogClassificationDetails({ modelDetails: hotdogModelDetails })).toMatchObject({
      origin: {
        source: 'styleGuess',
        placeName: hotdogModelDetails.originGuess.placeName,
        note: hotdogModelDetails.originGuess.note,
      },
    });
  });
});
