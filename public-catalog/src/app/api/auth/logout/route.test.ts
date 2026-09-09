import { describe, expect, it } from 'vitest';

import { OWNER_SESSION_COOKIE } from '@/lib/ownerSession';
import { POST } from './route';

describe('POST /api/auth/logout', () => {
  it('clears the owner session cookie', async () => {
    const res = await POST();

    expect(res.status).toBe(200);
    expect(res.headers.get('set-cookie')).toContain(OWNER_SESSION_COOKIE);
    expect(res.headers.get('set-cookie')).toContain('Max-Age=0');
  });
});
