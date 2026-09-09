import { beforeEach, describe, expect, it, vi } from 'vitest';

const signInWithPasswordMock = vi.fn();

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    auth: {
      signInWithPassword: signInWithPasswordMock,
    },
  }),
}));

import { OWNER_SESSION_COOKIE } from '@/lib/ownerSession';
import { POST } from './route';

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    signInWithPasswordMock.mockReset();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
  });

  it('sets the owner session cookie after successful login', async () => {
    signInWithPasswordMock.mockResolvedValue({
      data: {
        user: {
          id: 'user-1',
          email: 'user@example.com',
          user_metadata: { name: 'Test User' },
        },
      },
      error: null,
    });

    const req = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: 'user@example.com', password: 'password-123' }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(res.headers.get('set-cookie')).toContain(OWNER_SESSION_COOKIE);
  });
});
