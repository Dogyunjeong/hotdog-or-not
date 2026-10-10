import 'server-only';

import type { Database } from '@/shared/types';
import type { SupabaseClient } from '@supabase/supabase-js';

import { isVisitorSessionId } from '@/server/utils/visitorSessionCookie';

type VisitorSessionRow = Database['public']['Tables']['visitor_sessions']['Row'];

export interface VisitorSession {
  /** Bearer secret from the cookie — never expose it (paths, URLs, responses). */
  id: string;
  /** Non-secret id that scopes the visitor's storage paths. */
  storageFolderId: string;
  isOnboardingCompleted: boolean;
}

class VisitorSessionService {
  private _supabaseClient: SupabaseClient<Database>;

  constructor({ supabaseClient }: { supabaseClient: SupabaseClient<Database> }) {
    this._supabaseClient = supabaseClient;
  }

  private _toVisitorSession = (visitorSessionRow: VisitorSessionRow): VisitorSession => {
    return {
      id: visitorSessionRow.id,
      storageFolderId: visitorSessionRow.storage_folder_id,
      isOnboardingCompleted: visitorSessionRow.onboarding_completed_at !== null,
    };
  };

  private _findVisitorSessionRow = async (visitorSessionId: string) => {
    const { data: visitorSessionRow, error } = await this._supabaseClient
      .from('visitor_sessions')
      .select('*')
      .eq('id', visitorSessionId)
      .maybeSingle();

    if (error) {
      throw error;
    }
    return visitorSessionRow;
  };

  /**
   * Upsert, not insert: concurrent first requests carry the same proxy-issued id and must
   * converge on one row. On conflict it only rewrites `id` with itself.
   */
  private _createVisitorSession = async (visitorSessionId: string) => {
    const { data: createdVisitorSessionRow, error } = await this._supabaseClient
      .from('visitor_sessions')
      .upsert({ id: visitorSessionId }, { onConflict: 'id' })
      .select('*')
      .single();

    if (error) {
      throw error;
    }
    return createdVisitorSessionRow;
  };

  /**
   * Returns the cookie's session. A valid id without a row (issued by `proxy.ts`, or
   * a deleted session) gets its row created under that id; a missing or malformed
   * cookie starts a new session.
   */
  public resolveVisitorSession = async ({
    visitorSessionId,
  }: {
    visitorSessionId?: string;
  }): Promise<VisitorSession> => {
    if (!isVisitorSessionId(visitorSessionId)) {
      return this._toVisitorSession(await this._createVisitorSession(crypto.randomUUID()));
    }

    const existingVisitorSessionRow = await this._findVisitorSessionRow(visitorSessionId);

    if (!existingVisitorSessionRow) {
      return this._toVisitorSession(await this._createVisitorSession(visitorSessionId));
    }
    return this._toVisitorSession(existingVisitorSessionRow);
  };

  /** The cookie's existing session, or `undefined` — never creates one (used to erase data). */
  public findVisitorSession = async ({
    visitorSessionId,
  }: {
    visitorSessionId?: string;
  }): Promise<VisitorSession | undefined> => {
    if (!isVisitorSessionId(visitorSessionId)) {
      return undefined;
    }

    const existingVisitorSessionRow = await this._findVisitorSessionRow(visitorSessionId);

    if (!existingVisitorSessionRow) {
      return undefined;
    }
    return this._toVisitorSession(existingVisitorSessionRow);
  };

  /** Idempotent: keeps the first completion time. */
  public completeOnboarding = async ({ visitorSessionId }: { visitorSessionId: string }) => {
    const { error } = await this._supabaseClient
      .from('visitor_sessions')
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq('id', visitorSessionId)
      .is('onboarding_completed_at', null);

    if (error) {
      throw error;
    }
  };
}

export default VisitorSessionService;
