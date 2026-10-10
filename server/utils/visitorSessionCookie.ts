import 'server-only';

import { isProductionRuntime } from '@/server/configs/app.config';
import { readRequestCookie } from './readRequestCookie';
import { isUuid } from './uuid';

export const VISITOR_SESSION_COOKIE_NAME = 'hotdog_or_not_visitor_session';

const VISITOR_SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/** Session ids are UUIDs (`visitor_sessions.id`); anything else in the cookie is ignored. */
export const isVisitorSessionId = (visitorSessionId?: string): visitorSessionId is string => {
  return isUuid(visitorSessionId);
};

// Read raw: session ids are UUIDs, so anything that would need decoding is invalid anyway.
export const readVisitorSessionIdFromRequest = (request: Request): string | undefined => {
  return readRequestCookie(request, VISITOR_SESSION_COOKIE_NAME);
};

const buildVisitorSessionCookie = (visitorSessionId: string, maxAgeSeconds: number) => {
  const cookieAttributeList = [
    `${VISITOR_SESSION_COOKIE_NAME}=${visitorSessionId}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];

  if (isProductionRuntime()) {
    cookieAttributeList.push('Secure');
  }
  return cookieAttributeList.join('; ');
};

/**
 * Sets (or refreshes — sliding 1-year expiry) the session cookie on an API response.
 * Only set with `history` consent (see `historyConsent.ts`); declared in the cookie banner.
 */
export const withVisitorSessionCookie = (response: Response, visitorSessionId: string) => {
  response.headers.append(
    'Set-Cookie',
    buildVisitorSessionCookie(visitorSessionId, VISITOR_SESSION_COOKIE_MAX_AGE_SECONDS),
  );
  return response;
};

/** Removes the session cookie (after erasing the visitor's data). */
export const withClearedVisitorSessionCookie = (response: Response) => {
  response.headers.append('Set-Cookie', buildVisitorSessionCookie('', 0));
  return response;
};
