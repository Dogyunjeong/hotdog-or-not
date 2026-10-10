import { describe, expect, it } from 'vitest';

import { createFakeVisitorSessionSupabaseClient } from '@/test/helpers/createFakeVisitorSessionSupabaseClient';
import VisitorSessionService from './VisitorSession.service';

const PROXY_ISSUED_SESSION_ID = '2b1e7c8a-4c2f-4f7e-9d3a-6a1b2c3d4e5f';

const createVisitorSessionService = () => {
  const { supabaseClient, hasVisitorSession, getVisitorSessionCount } =
    createFakeVisitorSessionSupabaseClient();
  const visitorSessionService = new VisitorSessionService({ supabaseClient });
  return { visitorSessionService, hasVisitorSession, getVisitorSessionCount };
};

describe('VisitorSessionService', () => {
  it('creates a session when there is no cookie', async () => {
    const { visitorSessionService, getVisitorSessionCount } = createVisitorSessionService();

    await expect(visitorSessionService.resolveVisitorSession({})).resolves.toEqual({
      id: expect.any(String),
      storageFolderId: expect.any(String),
      isOnboardingCompleted: false,
    });
    expect(getVisitorSessionCount()).toBe(1);
  });

  it('creates a new session id for a malformed cookie', async () => {
    const { visitorSessionService, hasVisitorSession } = createVisitorSessionService();

    const visitorSession = await visitorSessionService.resolveVisitorSession({
      visitorSessionId: 'not-a-uuid',
    });

    expect(visitorSession.id).not.toBe('not-a-uuid');
    expect(hasVisitorSession(visitorSession.id)).toBe(true);
  });

  it('creates the row under a valid but unknown id, once for concurrent requests', async () => {
    const { visitorSessionService, getVisitorSessionCount } = createVisitorSessionService();

    const concurrentVisitorSessionList = await Promise.all([
      visitorSessionService.resolveVisitorSession({ visitorSessionId: PROXY_ISSUED_SESSION_ID }),
      visitorSessionService.resolveVisitorSession({ visitorSessionId: PROXY_ISSUED_SESSION_ID }),
    ]);

    expect(concurrentVisitorSessionList.map(({ id }) => id)).toEqual([
      PROXY_ISSUED_SESSION_ID,
      PROXY_ISSUED_SESSION_ID,
    ]);
    expect(getVisitorSessionCount()).toBe(1);
  });

  it('persists onboarding completion for the session', async () => {
    const { visitorSessionService } = createVisitorSessionService();
    const { id: visitorSessionId } = await visitorSessionService.resolveVisitorSession({});

    await visitorSessionService.completeOnboarding({ visitorSessionId });

    await expect(
      visitorSessionService.resolveVisitorSession({ visitorSessionId }),
    ).resolves.toMatchObject({ id: visitorSessionId, isOnboardingCompleted: true });
  });
});
