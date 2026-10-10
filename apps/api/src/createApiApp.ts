import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@seamflow/shared-types';
import { Hono } from 'hono';

import healthRoutes from './api/health/Health.routes.ts';
import noteRoutes from './api/note/Note.routes.ts';
import { getSupabaseClient } from './supabase/getSupabaseClient.ts';
import type { ApiEnv } from './types/ApiEnv.type.ts';
import { handleError } from './utils/handleError.ts';

/**
 * Builds the `/api` app. Runs inside the web app's `/api/*` resource route,
 * so frontend and API deploy together as one Vercel project.
 *
 * `supabaseClient` is injectable for tests; production resolves it lazily from env.
 */
const createApiApp = ({ supabaseClient }: { supabaseClient?: SupabaseClient<Database> } = {}) => {
  const apiApp = new Hono<ApiEnv>().basePath('/api');

  apiApp.use(async (c, next) => {
    c.set('getSupabaseClient', () => supabaseClient || getSupabaseClient());
    await next();
  });

  apiApp.route('/health', healthRoutes);
  apiApp.route('/notes', noteRoutes);

  apiApp.notFound((c) => c.json({ message: 'Not found' }, 404));
  apiApp.onError((error, c) => handleError({ c, error, defaultMessage: 'Something went wrong' }));

  return apiApp;
};

export default createApiApp;
