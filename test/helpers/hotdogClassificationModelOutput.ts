import type { HotdogClassificationModelOutput } from '@/server/api/hotdog/HotdogClassification.prompt';

/** A model answer for a photo of two Chicago-style hotdogs. */
export const HOTDOG_MODEL_OUTPUT: HotdogClassificationModelOutput = {
  isHotdog: true,
  reason: 'Classic ballpark dog.',
  details: {
    kind: 'hotdog',
    hotdogCount: 2,
    hotdogStyle: {
      name: 'Chicago-style',
      description: 'Poppy seed bun, neon relish, and absolutely no ketchup.',
    },
    tastiness: {
      score: 8.5,
      headline: 'A garden on a bun, and we mean that kindly.',
      breakdown: [
        { aspect: 'bun', score: 8, comment: 'Steamed and seeded.' },
        { aspect: 'sausage', score: 9, comment: 'Snappy all-beef.' },
        { aspect: 'toppings', score: 9, comment: 'Every topping showed up.' },
        { aspect: 'presentation', score: 7, comment: 'A little crowded.' },
      ],
    },
    ingredientList: ['all-beef frank', 'poppy seed bun', 'relish', 'tomato', 'pickle'],
    nutritionPerHotdog: { caloriesKcal: 320, proteinG: 12, fatG: 18, carbsG: 28, sodiumMg: 1100 },
    originGuess: {
      placeName: 'Chicago, Illinois, United States',
      note: 'Neon relish and sport peppers are a Chicago signature.',
    },
  },
};

/** A model answer for a salad: food, so it gets nutrition and a hotdog showdown line. */
export const NOT_HOTDOG_FOOD_MODEL_OUTPUT: HotdogClassificationModelOutput = {
  isHotdog: false,
  reason: 'That is a salad wearing no bun at all.',
  details: {
    kind: 'notHotdog',
    subject: { name: 'Caesar salad', description: 'Romaine, croutons and shaved parmesan.' },
    isFood: true,
    nutrition: { caloriesKcal: 180, proteinG: 6, fatG: 17.4, carbsG: 10, sodiumMg: 500 },
    verdictLine: 'Crunchy, leafy, and still jealous of the bun.',
  },
};
