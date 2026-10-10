import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@seamflow/shared-types';

export interface ApiEnv {
  Variables: {
    // Lazy so routes without DB access (health, 404) work even when Supabase env is missing.
    getSupabaseClient: () => SupabaseClient<Database>;
  };
}
