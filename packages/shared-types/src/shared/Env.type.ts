/**
 * API environment variables. Supabase names match what the Vercel Supabase integration injects.
 */
export interface SeamflowEnvironment {
  OPENAI_API_KEY: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}
