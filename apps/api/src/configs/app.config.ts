import type { SharedTypes } from '@seamflow/shared-types';

const REQUIRED_ENV_KEY_LIST: (keyof SharedTypes.SeamflowEnvironment)[] = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
];

let cachedSeamflowEnvironment: SharedTypes.SeamflowEnvironment | undefined;

/**
 * Reads API env once per runtime (one Vercel function instance).
 * Read lazily so `vite build` does not need secrets.
 */
export const getSeamflowEnvironment = (): SharedTypes.SeamflowEnvironment => {
  if (cachedSeamflowEnvironment) {
    return cachedSeamflowEnvironment;
  }

  const missingEnvKeyList = REQUIRED_ENV_KEY_LIST.filter((envKey) => !process.env[envKey]);

  if (missingEnvKeyList.length > 0) {
    throw new Error(`Missing environment variables: ${missingEnvKeyList.join(', ')}`);
  }

  cachedSeamflowEnvironment = {
    SUPABASE_URL: process.env.SUPABASE_URL as string,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY as string,
  };
  return cachedSeamflowEnvironment;
};
