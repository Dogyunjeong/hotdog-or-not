import 'server-only';

import type { Database, VisitorSessionTypes } from '@/shared/types';
import type { SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseClient } from '@/server/clients/supabase/getSupabaseClient';
import { handleError } from '@/server/utils/handleError';
import { withVisitorSessionCookie } from '@/server/utils/visitorSessionCookie';
import {
  resolveRequestVisitorSession,
  withRequestVisitorSessionCookie,
} from './resolveRequestVisitorSession';
import VisitorSessionService from './VisitorSession.service';

/** Guests can't have onboarding remembered: nothing may be stored for them. */
const GUEST_VISITOR_SESSION_RESPONSE: VisitorSessionTypes.CurrentVisitorSessionResponse = {
  isHistoryEnabled: false,
  isOnboardingCompleted: false,
};

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

  /** With history consent, also starts the session (and sets or refreshes its cookie). */
  public getCurrentVisitorSession = async (request: Request): Promise<Response> => {
    try {
      const { visitorSessionService } = this._getDependencies();
      const visitorSession = await resolveRequestVisitorSession({
        request,
        visitorSessionService,
      });

      if (!visitorSession) {
        return Response.json(GUEST_VISITOR_SESSION_RESPONSE);
      }

      const currentVisitorSessionResponse: VisitorSessionTypes.CurrentVisitorSessionResponse = {
        isHistoryEnabled: true,
        isOnboardingCompleted: visitorSession.isOnboardingCompleted,
      };
      // Always (re)sets the cookie: this is where its 1-year sliding expiry is refreshed.
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

  /** A guest's completion is kept in the browser's memory only, so this is a no-op for them. */
  public completeOnboarding = async (request: Request): Promise<Response> => {
    try {
      const { visitorSessionService } = this._getDependencies();
      const visitorSession = await resolveRequestVisitorSession({
        request,
        visitorSessionService,
      });

      if (!visitorSession) {
        return new Response(null, { status: 204 });
      }

      await visitorSessionService.completeOnboarding({ visitorSessionId: visitorSession.id });
      return withRequestVisitorSessionCookie(new Response(null, { status: 204 }), visitorSession);
    } catch (error) {
      return handleError({
        error,
        defaultMessage: 'We could not save your progress right now. Please try again in a moment.',
      });
    }
  };
}

export default VisitorSessionHandler;
