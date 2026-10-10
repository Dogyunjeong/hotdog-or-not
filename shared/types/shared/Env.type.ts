/**
 * API environment variables. Supabase names match what the Vercel Supabase integration injects.
 */
export interface HotdogOrNotEnvironment {
  OPENAI_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  /** Vercel Cron sends it as `Authorization: Bearer …`; guards `/api/cron/*`. */
  CRON_SECRET: string;
}
