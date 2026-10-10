'use client';

import { useEffect, useState } from 'react';

const HOTDOG_CLASSIFICATION_PROGRESS_MESSAGE_LIST = [
  'Checking for hotdog…',
  'Squinting at the bun…',
  'Counting the toppings…',
  'Guessing the calories (roughly)…',
  "Working out where it's from…",
];
const PROGRESS_MESSAGE_ROTATION_INTERVAL_MS = 2500;
const STILL_THINKING_DELAY_MS = 12_000;

/** The first message is shown once; the rotation then loops over the rest. */
const getProgressMessage = (rotationStep: number) => {
  if (rotationStep === 0) {
    return HOTDOG_CLASSIFICATION_PROGRESS_MESSAGE_LIST[0];
  }

  const loopingMessageCount = HOTDOG_CLASSIFICATION_PROGRESS_MESSAGE_LIST.length - 1;
  return HOTDOG_CLASSIFICATION_PROGRESS_MESSAGE_LIST[
    1 + ((rotationStep - 1) % loopingMessageCount)
  ];
};

/**
 * Playful copy while the model works: rotates every 2.5s, and admits it's slow after 12s.
 * Starts over whenever the component using it mounts.
 */
export const useHotdogClassificationProgressMessage = () => {
  const [rotationStep, setRotationStep] = useState(0);
  const [isStillThinking, setIsStillThinking] = useState(false);

  useEffect(() => {
    const rotationIntervalId = setInterval(() => {
      setRotationStep((currentRotationStep) => currentRotationStep + 1);
    }, PROGRESS_MESSAGE_ROTATION_INTERVAL_MS);
    const stillThinkingTimeoutId = setTimeout(() => {
      setIsStillThinking(true);
    }, STILL_THINKING_DELAY_MS);

    return () => {
      clearInterval(rotationIntervalId);
      clearTimeout(stillThinkingTimeoutId);
    };
  }, []);

  return {
    /** Announced once; the rotating message is visual only. */
    announcedProgressMessage: HOTDOG_CLASSIFICATION_PROGRESS_MESSAGE_LIST[0],
    rotatingProgressMessage: getProgressMessage(rotationStep),
    isStillThinking,
  };
};
