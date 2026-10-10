import VisitorSessionHandler from '@/server/api/visitorSession/VisitorSession.handler';
import { VISITOR_SESSION_COOKIE_NAME } from '@/server/utils/visitorSessionCookie';
import { VisitorSessionController } from '@/shared/controllers';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { HISTORY_CONSENT_COOKIE, NECESSARY_ONLY_CONSENT_COOKIE } from '../../helpers/consentCookie';
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
 * does, and sends the consent cookie plus the last session cookie like a browser would.
 */
const stubFetchWithBrowserCookie = ({
  visitorSessionHandler,
  consentCookie,
}: {
  visitorSessionHandler: VisitorSessionHandler;
  consentCookie: string;
}) => {
  const setCookieHeaderList: string[] = [];

  vi.stubGlobal('fetch', async (input: RequestInfo | URL, init?: RequestInit) => {
    const headers = new Headers(init?.headers);
    const lastSessionCookie = setCookieHeaderList.findLast(Boolean)?.split(';')[0];
    headers.set('cookie', [consentCookie, lastSessionCookie].filter(Boolean).join('; '));

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

  it('starts a session with a cookie and remembers onboarding completion (history consent)', async () => {
    const { supabaseClient } = createFakeVisitorSessionSupabaseClient();
    const { setCookieHeaderList } = stubFetchWithBrowserCookie({
      visitorSessionHandler: new VisitorSessionHandler({ supabaseClient }),
      consentCookie: HISTORY_CONSENT_COOKIE,
    });
    const visitorSessionController = new VisitorSessionController({ baseUrl: TEST_BASE_URL });

    await expect(visitorSessionController.getCurrentVisitorSession()).resolves.toEqual({
      isHistoryEnabled: true,
      isOnboardingCompleted: false,
    });
    expect(setCookieHeaderList[0]).toMatch(
      new RegExp(
        `^${VISITOR_SESSION_COOKIE_NAME}=[0-9a-f-]{36}; Path=/; HttpOnly; SameSite=Lax; Max-Age=31536000$`,
      ),
    );

    await visitorSessionController.completeOnboarding();

    await expect(visitorSessionController.getCurrentVisitorSession()).resolves.toEqual({
      isHistoryEnabled: true,
      isOnboardingCompleted: true,
    });
    // The browser already holds the cookie: only GET current refreshes it (sliding expiry).
    const [firstGetSetCookie, onboardingSetCookie, secondGetSetCookie] = setCookieHeaderList;
    expect(onboardingSetCookie).toBe('');
    expect(secondGetSetCookie).toBe(firstGetSetCookie);
  });

  it('keeps a guest (no history consent) without a session cookie or row', async () => {
    const { supabaseClient, getVisitorSessionCount } = createFakeVisitorSessionSupabaseClient();
    const { setCookieHeaderList } = stubFetchWithBrowserCookie({
      visitorSessionHandler: new VisitorSessionHandler({ supabaseClient }),
      consentCookie: NECESSARY_ONLY_CONSENT_COOKIE,
    });
    const visitorSessionController = new VisitorSessionController({ baseUrl: TEST_BASE_URL });

    await expect(visitorSessionController.getCurrentVisitorSession()).resolves.toEqual({
      isHistoryEnabled: false,
      isOnboardingCompleted: false,
    });
    await visitorSessionController.completeOnboarding();

    expect(setCookieHeaderList).toEqual(['', '']);
    expect(getVisitorSessionCount()).toBe(0);
  });
});
