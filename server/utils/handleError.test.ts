import { describe, expect, it, vi } from 'vitest';

import { handleError } from './handleError';

describe('handleError', () => {
  it('logs only the error type and code, never the message', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const databaseError = Object.assign(
      new Error('Key (visitor_session_id)=(2b1e7c8a-…) is not present'),
      { code: '23503' },
    );

    const response = handleError({ error: databaseError, defaultMessage: 'Something went wrong' });

    expect(response.status).toBe(500);
    await expect(response.json()).resolves.toEqual({ message: 'Something went wrong' });
    expect(JSON.stringify(consoleErrorSpy.mock.calls)).not.toContain('visitor_session_id');
    expect(consoleErrorSpy).toHaveBeenCalledWith('Unexpected API error', {
      name: 'Error',
      code: '23503',
    });
    consoleErrorSpy.mockRestore();
  });
});
