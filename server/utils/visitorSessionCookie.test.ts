import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  readVisitorSessionIdFromRequest,
  VISITOR_SESSION_COOKIE_NAME,
  withVisitorSessionCookie,
} from './visitorSessionCookie';

const visitorSessionId = '2b1e7c8a-4c2f-4f7e-9d3a-6a1b2c3d4e5f';

describe('visitorSessionCookie', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('reads the session id among other cookies', () => {
    const request = new Request('http://localhost', {
      headers: { cookie: `theme=dark; ${VISITOR_SESSION_COOKIE_NAME}=${visitorSessionId}; a=b` },
    });

    expect(readVisitorSessionIdFromRequest(request)).toBe(visitorSessionId);
  });

  it('returns undefined without the cookie', () => {
    expect(readVisitorSessionIdFromRequest(new Request('http://localhost'))).toBe(undefined);
  });

  it('sets an httpOnly, lax, 1-year cookie', () => {
    const setCookie = withVisitorSessionCookie(new Response(null), visitorSessionId).headers.get(
      'set-cookie',
    );

    expect(setCookie).toBe(
      `${VISITOR_SESSION_COOKIE_NAME}=${visitorSessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000`,
    );
  });

  it('adds Secure in production', () => {
    vi.stubEnv('NODE_ENV', 'production');

    const setCookie = withVisitorSessionCookie(new Response(null), visitorSessionId).headers.get(
      'set-cookie',
    );

    expect(setCookie).toContain('; Secure');
  });
});
