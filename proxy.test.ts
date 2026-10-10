import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

import { proxy } from './proxy';
import { VISITOR_SESSION_COOKIE_NAME } from './server/utils/visitorSessionCookie';
import {
  HISTORY_CONSENT_COOKIE,
  NECESSARY_ONLY_CONSENT_COOKIE,
} from './test/helpers/consentCookie';

const createPageRequest = (cookieList: string[] = []) => {
  const headers: Record<string, string> =
    cookieList.length > 0 ? { cookie: cookieList.join('; ') } : {};
  return new NextRequest('http://localhost/', { headers });
};

describe('proxy', () => {
  it('sets no session cookie without history consent', () => {
    const undecidedSetCookie = proxy(createPageRequest()).headers.get('set-cookie');
    const rejectedSetCookie = proxy(createPageRequest([NECESSARY_ONLY_CONSENT_COOKIE])).headers.get(
      'set-cookie',
    );

    expect(undecidedSetCookie).toBe(null);
    expect(rejectedSetCookie).toBe(null);
  });

  it('issues a session cookie with history consent when it is missing or malformed (no throw)', () => {
    const missingCookieSetCookie = proxy(createPageRequest([HISTORY_CONSENT_COOKIE])).headers.get(
      'set-cookie',
    );
    const malformedCookieSetCookie = proxy(
      createPageRequest([HISTORY_CONSENT_COOKIE, `${VISITOR_SESSION_COOKIE_NAME}=%E0%A4%A`]),
    ).headers.get('set-cookie');

    expect(missingCookieSetCookie).toMatch(
      new RegExp(`^${VISITOR_SESSION_COOKIE_NAME}=[0-9a-f-]{36}; Path=/; HttpOnly; SameSite=Lax`),
    );
    expect(malformedCookieSetCookie).toContain(`${VISITOR_SESSION_COOKIE_NAME}=`);
  });

  it('keeps a valid session cookie as is', () => {
    const response = proxy(
      createPageRequest([
        HISTORY_CONSENT_COOKIE,
        `${VISITOR_SESSION_COOKIE_NAME}=2b1e7c8a-4c2f-4f7e-9d3a-6a1b2c3d4e5f`,
      ]),
    );

    expect(response.headers.get('set-cookie')).toBe(null);
  });
});
