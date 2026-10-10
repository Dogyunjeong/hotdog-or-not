import 'server-only';

import type { Database } from '@/shared/types';
import type { SupabaseClient } from '@supabase/supabase-js';

import { findRequestVisitorSession } from '@/server/api/visitorSession/resolveRequestVisitorSession';
import VisitorSessionService from '@/server/api/visitorSession/VisitorSession.service';
import { getSupabaseClient } from '@/server/clients/supabase/getSupabaseClient';
import {
  getSupabaseStorageClient,
  type SupabaseStorageClient,
} from '@/server/clients/supabase/SupabaseStorage.client';
import { handleError } from '@/server/utils/handleError';
import { hasHistoryConsent } from '@/server/utils/historyConsent';
import {
  readVisitorSessionIdFromRequest,
  withClearedVisitorSessionCookie,
  withVisitorSessionCookie,
} from '@/server/utils/visitorSessionCookie';
import HotdogClassificationDeletionService from './HotdogClassificationDeletion.service';
import VisitorDataErasureService from './VisitorDataErasure.service';

/**
 * Deleting never needs history consent and never creates a session: it only acts on the
 * session the cookie already points to.
 */
class DataDeletionHandler {
  private _supabaseClient?: SupabaseClient<Database>;
  private _supabaseStorageClient?: SupabaseStorageClient;

  /** Dependencies are injectable for tests; production resolves them lazily from env. */
  constructor({
    supabaseClient,
    supabaseStorageClient,
  }: {
    supabaseClient?: SupabaseClient<Database>;
    supabaseStorageClient?: SupabaseStorageClient;
  } = {}) {
    this._supabaseClient = supabaseClient;
    this._supabaseStorageClient = supabaseStorageClient;
  }

  private _getDependencies = () => {
    const supabaseClient = this._supabaseClient || getSupabaseClient();
    const supabaseStorageClient = this._supabaseStorageClient || getSupabaseStorageClient();
    return {
      visitorSessionService: new VisitorSessionService({ supabaseClient }),
      hotdogClassificationDeletionService: new HotdogClassificationDeletionService({
        supabaseClient,
        supabaseStorageClient,
      }),
      visitorDataErasureService: new VisitorDataErasureService({
        supabaseClient,
        supabaseStorageClient,
      }),
    };
  };

  /**
   * - History still on ("Delete my data"): a fresh id, like `proxy.ts` issues — no row until it's
   *   used, and parallel first requests converge on it instead of each starting a session.
   * - History off (revoked): the cookie is cleared, if the browser still sent one.
   */
  private _withVisitorSessionCookieAfterErase = (response: Response, request: Request) => {
    if (hasHistoryConsent(request)) {
      return withVisitorSessionCookie(response, crypto.randomUUID());
    }

    if (readVisitorSessionIdFromRequest(request) === undefined) {
      return response;
    }
    return withClearedVisitorSessionCookie(response);
  };

  /** 404 for a guest, an unknown id, or another visitor's classification. */
  public deleteHotdogClassification = async (
    request: Request,
    { hotdogClassificationId }: { hotdogClassificationId: string },
  ): Promise<Response> => {
    try {
      const { visitorSessionService, hotdogClassificationDeletionService } =
        this._getDependencies();
      const visitorSession = await findRequestVisitorSession({ request, visitorSessionService });

      await hotdogClassificationDeletionService.deleteHotdogClassification({
        visitorSessionId: visitorSession?.id,
        hotdogClassificationId,
      });
      return new Response(null, { status: 204 });
    } catch (error) {
      return handleError({
        error,
        defaultMessage: "We couldn't delete this photo right now. Please try again.",
      });
    }
  };

  /**
   * Erases the visitor's files, results and session. Without a saved session there is nothing
   * to erase (still 204).
   */
  public eraseVisitorData = async (request: Request): Promise<Response> => {
    try {
      const { visitorSessionService, visitorDataErasureService } = this._getDependencies();
      const visitorSession = await findRequestVisitorSession({ request, visitorSessionService });

      if (visitorSession) {
        await visitorDataErasureService.eraseVisitorData({ visitorSession });
      }
      return this._withVisitorSessionCookieAfterErase(new Response(null, { status: 204 }), request);
    } catch (error) {
      return handleError({
        error,
        defaultMessage: "We couldn't delete your data right now. It's safe to try again.",
      });
    }
  };
}

export default DataDeletionHandler;
