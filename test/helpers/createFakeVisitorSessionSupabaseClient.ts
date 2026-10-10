import type { Database } from '@/shared/types';
import type { SupabaseClient } from '@supabase/supabase-js';

type VisitorSessionRow = Database['public']['Tables']['visitor_sessions']['Row'];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * In-memory fake of the `visitor_sessions` query chains `VisitorSessionService` uses.
 * Like Postgres, filtering by a non-uuid id is an error — so the service must guard it.
 */
export const createFakeVisitorSessionSupabaseClient = () => {
  const visitorSessionRowMap = new Map<string, VisitorSessionRow>();

  const toQueryResult = <T>(data: T) => ({ data, error: null });

  const toInvalidUuidResult = (visitorSessionId: string) => ({
    data: null,
    error: new Error(`invalid input syntax for type uuid: "${visitorSessionId}"`),
  });

  const findVisitorSession = async (visitorSessionId: string) => {
    if (!UUID_PATTERN.test(visitorSessionId)) {
      return toInvalidUuidResult(visitorSessionId);
    }
    return toQueryResult(visitorSessionRowMap.get(visitorSessionId) ?? null);
  };

  /** `upsert({ id }, { onConflict: 'id' }).select().single()` */
  const upsertVisitorSession = async (visitorSessionId: string) => {
    const existingVisitorSessionRow = visitorSessionRowMap.get(visitorSessionId);

    if (existingVisitorSessionRow) {
      return toQueryResult(existingVisitorSessionRow);
    }

    const createdVisitorSessionRow: VisitorSessionRow = {
      id: visitorSessionId,
      storage_folder_id: crypto.randomUUID(),
      onboarding_completed_at: null,
      created_at: new Date().toISOString(),
    };
    visitorSessionRowMap.set(visitorSessionId, createdVisitorSessionRow);
    return toQueryResult(createdVisitorSessionRow);
  };

  /** `update(...).eq('id', id).is('onboarding_completed_at', null)` */
  const updateIncompleteOnboarding = async (
    visitorSessionId: string,
    visitorSessionUpdate: Partial<VisitorSessionRow>,
  ) => {
    if (!UUID_PATTERN.test(visitorSessionId)) {
      return toInvalidUuidResult(visitorSessionId);
    }

    const existingVisitorSessionRow = visitorSessionRowMap.get(visitorSessionId);
    const isOnboardingIncomplete = existingVisitorSessionRow?.onboarding_completed_at === null;

    if (!existingVisitorSessionRow || !isOnboardingIncomplete) {
      return toQueryResult(null);
    }

    visitorSessionRowMap.set(visitorSessionId, {
      ...existingVisitorSessionRow,
      ...visitorSessionUpdate,
    });
    return toQueryResult(null);
  };

  const from = (tableName: string) => {
    if (tableName !== 'visitor_sessions') {
      throw new Error(`Unexpected table in visitor session fake: ${tableName}`);
    }

    return {
      select: () => ({
        eq: (_idColumn: string, visitorSessionId: string) => ({
          maybeSingle: () => findVisitorSession(visitorSessionId),
        }),
      }),
      upsert: ({ id: visitorSessionId }: { id: string }) => ({
        select: () => ({
          single: () => upsertVisitorSession(visitorSessionId),
        }),
      }),
      update: (visitorSessionUpdate: Partial<VisitorSessionRow>) => ({
        eq: (_idColumn: string, visitorSessionId: string) => ({
          is: () => updateIncompleteOnboarding(visitorSessionId, visitorSessionUpdate),
        }),
      }),
    };
  };

  const supabaseClient = { from } as unknown as SupabaseClient<Database>;

  return {
    supabaseClient,
    hasVisitorSession: (visitorSessionId: string) => visitorSessionRowMap.has(visitorSessionId),
    getVisitorSessionCount: () => visitorSessionRowMap.size,
  };
};
