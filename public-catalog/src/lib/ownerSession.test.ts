import { describe, expect, it } from 'vitest';

import { readOwnerSessionFromRequest, signOwnerSession, verifyOwnerSession } from './ownerSession';

describe('ownerSession', () => {
  it('round-trips a signed owner session for trusted ownership', () => {
    const token = signOwnerSession({
      userId: 'user-1',
      deviceId: 'device-1',
    });

    expect(verifyOwnerSession(token)).toEqual({
      userId: 'user-1',
      deviceId: 'device-1',
    });
  });

  it('rejects tampered cookies and reads valid request cookies', () => {
    const token = signOwnerSession({ userId: 'user-2' });
    const request = new Request('http://localhost/api/gallery', {
      headers: {
        cookie: `ft_owner_session=${token}`,
      },
    });

    expect(readOwnerSessionFromRequest(request)).toEqual({ userId: 'user-2' });
    expect(verifyOwnerSession(`${token}tampered`)).toBeNull();
  });
});
