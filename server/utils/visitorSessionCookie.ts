import 'server-only';

import { isProductionRuntime } from '@/server/configs/app.config';

export const VISITOR_SESSION_COOKIE_NAME = 'hotdog_or_not_visitor_session';

const VISITOR_SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

const VISITOR_SESSION_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Session ids are UUIDs (`visitor_sessions.id`); anything else in the cookie is ignored. */
export const isVisitorSessionId = (visitorSessionId?: string): visitorSessionId is string => {
  return !!visitorSessionId && VISITOR_SESSION_ID_PATTERN.test(visitorSessionId);
};

export const readVisitorSessionIdFromRequest = (request: Request): string | undefined => {
  const cookieHeader = request.headers.get('cookie') ?? '';
  const visitorSessionCookie = cookieHeader
    .split(';')
    .map((cookiePair) => cookiePair.trim())
    .find((cookiePair) => cookiePair.startsWith(`${VISITOR_SESSION_COOKIE_NAME}=`));

  if (!visitorSessionCookie) {
    return undefined;
  }
  // Read raw: session ids are UUIDs, so anything that would need decoding is invalid anyway.
  return visitorSessionCookie.slice(VISITOR_SESSION_COOKIE_NAME.length + 1);
};

const buildVisitorSessionCookie = (visitorSessionId: string) => {
  const cookieAttributeList = [
    `${VISITOR_SESSION_COOKIE_NAME}=${visitorSessionId}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${VISITOR_SESSION_COOKIE_MAX_AGE_SECONDS}`,
  ];

  if (isProductionRuntime()) {
    cookieAttributeList.push('Secure');
  }
  return cookieAttributeList.join('; ');
};

/**
 * Sets (or refreshes — sliding 1-year expiry) the session cookie on an API response.
 * Strictly necessary cookie: keeps the visitor's history; declared in the cookie banner.
 */
export const withVisitorSessionCookie = (response: Response, visitorSessionId: string) => {
  response.headers.append('Set-Cookie', buildVisitorSessionCookie(visitorSessionId));
  return response;
};
