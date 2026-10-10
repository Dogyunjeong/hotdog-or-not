import type { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';

import { routing } from '@/i18n/routing';
import { hasHistoryConsent } from '@/server/utils/historyConsent';
import {
  isVisitorSessionId,
  readVisitorSessionIdFromRequest,
  withVisitorSessionCookie,
} from '@/server/utils/visitorSessionCookie';

const handleLocaleRouting = createIntlMiddleware(routing);

/**
 * 1. Locale routing (next-intl): `/` is English, `/ko/...` Korean; no locale cookie.
 * 2. Issues the visitor session id with the page, before the browser makes any API call,
 *    so parallel first-visit API calls don't each start their own session.
 *    Only with `history` consent: guests get no session cookie at all.
 *    No DB call here: the API creates the row for this id on first use.
 */
export const proxy = (request: NextRequest) => {
  const response = handleLocaleRouting(request);

  if (!hasHistoryConsent(request)) {
    return response;
  }

  if (isVisitorSessionId(readVisitorSessionIdFromRequest(request))) {
    return response;
  }
  return withVisitorSessionCookie(response, crypto.randomUUID());
};

export const config = {
  // Pages only: skip API routes (they resolve the session themselves), build assets, and files.
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
};
