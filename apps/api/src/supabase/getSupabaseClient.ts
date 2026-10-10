import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@seamflow/shared-types';

import { getEnvironmentVariable } from '../configs/app.config.ts';

let supabaseClient: SupabaseClient<Database> | undefined;

/**
 * Server-only client with the service role key. Never import from browser code.
 */
export const getSupabaseClient = (): SupabaseClient<Database> => {
  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = createClient<Database>(
    getEnvironmentVariable('SUPABASE_URL'),
    getEnvironmentVariable('SUPABASE_SERVICE_ROLE_KEY'),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  return supabaseClient;
};
