import { type NextRequest, NextResponse } from 'next/server';

import { hasHistoryConsent } from '@/server/utils/historyConsent';
import {
  isVisitorSessionId,
  readVisitorSessionIdFromRequest,
  withVisitorSessionCookie,
} from '@/server/utils/visitorSessionCookie';

/**
 * Issues the visitor session id with the page, before the browser makes any API call.
 * Otherwise parallel first-visit API calls would each start their own session.
 * Only with `history` consent: guests get no session cookie at all.
 * No DB call here: the API creates the row for this id on first use.
 */
export const proxy = (request: NextRequest) => {
  if (!hasHistoryConsent(request)) {
    return NextResponse.next();
  }

  if (isVisitorSessionId(readVisitorSessionIdFromRequest(request))) {
    return NextResponse.next();
  }
  return withVisitorSessionCookie(NextResponse.next(), crypto.randomUUID());
};

export const config = {
  // Pages only: skip API routes (they resolve the session themselves), build assets, and files.
  matcher: ['/((?!api|_next/static|_next/image|.*\\..*).*)'],
};
