import type { SharedTypes } from '@seamflow/shared-types';

/**
 * Single entry point for API env. Read lazily per client so a missing key only breaks
 * the feature that needs it, and `next build` does not need secrets.
 */
export const getEnvironmentVariable = (envKey: keyof SharedTypes.SeamflowEnvironment): string => {
  const envValue = process.env[envKey];

  if (!envValue) {
    throw new Error(`Missing environment variable: ${envKey}`);
  }
  return envValue;
};
