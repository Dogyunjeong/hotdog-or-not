import { zodTextFormat } from 'openai/helpers/zod';
import { z } from 'zod';

/** Cheap vision-capable tier; a hotdog check doesn't need a frontier model. */
export const HOTDOG_CLASSIFICATION_MODEL = 'gpt-5.4-mini';

export const HOTDOG_CLASSIFICATION_INSTRUCTIONS = `You are the judge of a "Hotdog or Not Hotdog" app.
Look at the image and decide whether its main subject is a hotdog.

A hotdog is a sausage (frankfurter, wiener, bratwurst, etc.) served in a sliced bun. Toppings are fine.
Photos, drawings, and toys of a hotdog count as a hotdog.
Everything else is not a hotdog, including a sausage without a bun or a bun without a sausage.

Write the reason as one short, friendly sentence a user would enjoy reading.`;

const hotdogClassificationSchema = z.object({
  isHotdog: z.boolean(),
  reason: z.string(),
});

export const HOTDOG_CLASSIFICATION_TEXT_FORMAT = zodTextFormat(
  hotdogClassificationSchema,
  'hotdog_classification',
);
