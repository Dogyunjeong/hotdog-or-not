import 'server-only';

import type { Database, VisitorSessionTypes } from '@/shared/types';
import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseClient } from '@/server/clients/supabase/getSupabaseClient';
import { handleError } from '@/server/utils/handleError';
import {
  readVisitorSessionIdFromRequest,
  withVisitorSessionCookie,
} from '@/server/utils/visitorSessionCookie';
import VisitorSessionService from './VisitorSession.service';

class VisitorSessionHandler {
  private _supabaseClient?: SupabaseClient<Database>;

  /** The Supabase client is injectable for tests; production resolves it lazily from env. */
  constructor({ supabaseClient }: { supabaseClient?: SupabaseClient<Database> } = {}) {
    this._supabaseClient = supabaseClient;
  }

  private _getDependencies = () => {
    const visitorSessionService = new VisitorSessionService({
      supabaseClient: this._supabaseClient || getSupabaseClient(),
    });
    return { visitorSessionService };
  };

  /** Also starts the session (and sets the cookie) on a first visit. */
  public getCurrentVisitorSession = async (request: Request): Promise<Response> => {
    try {
      const { visitorSessionService } = this._getDependencies();
      const visitorSession = await visitorSessionService.resolveVisitorSession({
        visitorSessionId: readVisitorSessionIdFromRequest(request),
      });
      const currentVisitorSessionResponse: VisitorSessionTypes.CurrentVisitorSessionResponse = {
        isOnboardingCompleted: visitorSession.isOnboardingCompleted,
      };
      return withVisitorSessionCookie(
        Response.json(currentVisitorSessionResponse),
        visitorSession.id,
      );
    } catch (error) {
      return handleError({
        error,
        defaultMessage: 'We could not load your session right now. Please refresh the page.',
      });
    }
  };

  public completeOnboarding = async (request: Request): Promise<Response> => {
    try {
      const { visitorSessionService } = this._getDependencies();
      const visitorSession = await visitorSessionService.resolveVisitorSession({
        visitorSessionId: readVisitorSessionIdFromRequest(request),
      });
      await visitorSessionService.completeOnboarding({ visitorSessionId: visitorSession.id });
      return withVisitorSessionCookie(new Response(null, { status: 204 }), visitorSession.id);
    } catch (error) {
      return handleError({
        error,
        defaultMessage: 'We could not save your progress right now. Please try again in a moment.',
      });
    }
  };
}

export default VisitorSessionHandler;
