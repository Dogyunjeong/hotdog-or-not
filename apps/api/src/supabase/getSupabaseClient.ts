import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@seamflow/shared-types';

import { getSeamflowEnvironment } from '../configs/app.config.ts';

let supabaseClient: SupabaseClient<Database> | undefined;

/**
 * Server-only client with the service role key. Never import from browser code.
 */
export const getSupabaseClient = (): SupabaseClient<Database> => {
  if (supabaseClient) {
    return supabaseClient;
  }

  const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } = getSeamflowEnvironment();
  supabaseClient = createClient<Database>(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return supabaseClient;
};
