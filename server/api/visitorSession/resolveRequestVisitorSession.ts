import 'server-only';

import { hasHistoryConsent } from '@/server/utils/historyConsent';
import {
  readVisitorSessionIdFromRequest,
  withVisitorSessionCookie,
} from '@/server/utils/visitorSessionCookie';
import type VisitorSessionService from './VisitorSession.service';
import type { VisitorSession } from './VisitorSession.service';

/** The request's session, plus whether the request's cookie already carries its id. */
export interface RequestVisitorSession extends VisitorSession {
  isSessionCookieCurrent: boolean;
}

/**
 * The request's visitor session, or `undefined` for a guest.
 * Guests (no `history` consent) never get a session row or a session cookie —
 * even if an old session cookie is still around.
 */
export const resolveRequestVisitorSession = async ({
  request,
  visitorSessionService,
}: {
  request: Request;
  visitorSessionService: VisitorSessionService;
}): Promise<RequestVisitorSession | undefined> => {
  if (!hasHistoryConsent(request)) {
    return undefined;
  }

  const requestVisitorSessionId = readVisitorSessionIdFromRequest(request);
  const visitorSession = await visitorSessionService.resolveVisitorSession({
    visitorSessionId: requestVisitorSessionId,
  });
  return {
    ...visitorSession,
    isSessionCookieCurrent: visitorSession.id === requestVisitorSessionId,
  };
};

/**
 * The session the request's cookie points to, or `undefined` — never creates one.
 * For deleting data only, so it deliberately ignores consent: revoking `history` removes it
 * from the consent cookie *before* the browser asks us to erase what was saved.
 */
export const findRequestVisitorSession = ({
  request,
  visitorSessionService,
}: {
  request: Request;
  visitorSessionService: VisitorSessionService;
}): Promise<VisitorSession | undefined> => {
  return visitorSessionService.findVisitorSession({
    visitorSessionId: readVisitorSessionIdFromRequest(request),
  });
};

/**
 * Sets the session cookie only when the browser doesn't have it yet (new or replaced session).
 * Re-sending an unchanged cookie could bring back one that "Delete my data" just cleared, from
 * a response that was already in flight. `GET /api/visitor-sessions/current` keeps the sliding
 * expiry fresh instead.
 */
export const withRequestVisitorSessionCookie = (
  response: Response,
  visitorSession: RequestVisitorSession | undefined,
) => {
  if (!visitorSession || visitorSession.isSessionCookieCurrent) {
    return response;
  }
  return withVisitorSessionCookie(response, visitorSession.id);
};
