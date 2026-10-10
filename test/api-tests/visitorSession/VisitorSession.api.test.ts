import VisitorSessionHandler from '@/server/api/visitorSession/VisitorSession.handler';
import { VISITOR_SESSION_COOKIE_NAME } from '@/server/utils/visitorSessionCookie';
import { VisitorSessionController } from '@/shared/controllers';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createFakeVisitorSessionSupabaseClient } from '../../helpers/createFakeVisitorSessionSupabaseClient';

const TEST_BASE_URL = 'http://localhost';

const routeRequest = (visitorSessionHandler: VisitorSessionHandler, request: Request) => {
  const routeKey = `${request.method} ${new URL(request.url).pathname}`;

  switch (routeKey) {
    case 'GET /api/visitor-sessions/current':
      return visitorSessionHandler.getCurrentVisitorSession(request);
    case 'POST /api/visitor-sessions/current/onboarding-completion':
      return visitorSessionHandler.completeOnboarding(request);
    default:
      throw new Error(`Unexpected request: ${routeKey}`);
  }
};

/**
 * Routes controller requests into the handler the same way `app/api/visitor-sessions/**`
 * does, and sends back the last session cookie like a browser would.
 */
const stubFetchWithBrowserCookie = (visitorSessionHandler: VisitorSessionHandler) => {
  const setCookieHeaderList: string[] = [];

  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    const lastSetCookieHeader = setCookieHeaderList.at(-1);

    if (lastSetCookieHeader) {
      headers.set('cookie', lastSetCookieHeader.split(';')[0]);
    }

    const response = await routeRequest(
      visitorSessionHandler,
      new Request(input, { ...init, headers }),
    );
    setCookieHeaderList.push(response.headers.get('set-cookie') ?? '');
    return response;
  });

  return { setCookieHeaderList };
};

describe('visitor session API', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('starts a session with a cookie and remembers onboarding completion', async () => {
    const { supabaseClient } = createFakeVisitorSessionSupabaseClient();
    const { setCookieHeaderList } = stubFetchWithBrowserCookie(
      new VisitorSessionHandler({ supabaseClient }),
    );
    const visitorSessionController = new VisitorSessionController({ baseUrl: TEST_BASE_URL });

    await expect(visitorSessionController.getCurrentVisitorSession()).resolves.toEqual({
      isOnboardingCompleted: false,
    });
    expect(setCookieHeaderList[0]).toMatch(
      new RegExp(
        `^${VISITOR_SESSION_COOKIE_NAME}=[0-9a-f-]{36}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000$`,
      ),
    );

    await visitorSessionController.completeOnboarding();

    await expect(visitorSessionController.getCurrentVisitorSession()).resolves.toEqual({
      isOnboardingCompleted: true,
    });
    expect(new Set(setCookieHeaderList).size).toBe(1);
  });
});
