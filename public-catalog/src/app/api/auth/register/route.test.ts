import { beforeEach, describe, expect, it, vi } from 'vitest';

const createUserMock = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      admin: {
        createUser: createUserMock,
      },
    },
  }),
}));

import { OWNER_SESSION_COOKIE } from '@/lib/ownerSession';
import { POST } from './route';

describe('POST /api/auth/register', () => {
  beforeEach(() => {
    createUserMock.mockReset();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-key';
  });

  it('sets the owner session cookie after successful registration', async () => {
    createUserMock.mockResolvedValue({
      data: {
        user: {
          id: 'user-2',
          email: 'new@example.com',
          user_metadata: { name: 'New User' },
        },
      },
      error: null,
    });

    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'new@example.com', password: 'password-123', name: 'New User' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(res.headers.get('set-cookie')).toContain(OWNER_SESSION_COOKIE);
  });
});
