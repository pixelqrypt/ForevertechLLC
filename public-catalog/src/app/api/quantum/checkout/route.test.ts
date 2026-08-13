import { beforeEach, describe, expect, it, vi } from 'vitest';

const createSessionMock = vi.fn(async () => ({ id: 'cs_test_quantum', url: 'https://stripe.test/quantum-checkout' }));

vi.mock('stripe', () => {
  return {
    default: class StripeMock {
      checkout = {
        sessions: {
          create: createSessionMock,
        },
      };
      constructor() {}
    },
  };
});

import { POST } from './route';

describe('quantum checkout route', () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.NEXT_PUBLIC_SITE_URL = 'http://localhost:3001';
    createSessionMock.mockClear();
  });

  it('creates a Stripe checkout session for the $9.99 real quantum image unlock', async () => {
    const req = new Request('http://localhost/api/quantum/checkout', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        prompt: 'quantum wormhole fractal',
        deviceId: 'device-1',
        userId: 'user-1',
        email: 'artist@example.com',
      }),
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(createSessionMock).toHaveBeenCalledTimes(1);
    const createArgs = createSessionMock.mock.calls[0][0];
    expect(createArgs.success_url).toContain('/studio?quantum_session_id={CHECKOUT_SESSION_ID}');
    expect(createArgs.cancel_url).toContain('/studio');
    expect(createArgs.line_items[0].price_data.unit_amount).toBe(999);
    expect(createArgs.metadata.deviceId).toBe('device-1');
    expect(createArgs.metadata.userId).toBe('user-1');
    expect(createArgs.metadata.quantumType).toBe('image_generation');
    expect(typeof createArgs.metadata.promptHash).toBe('string');
    expect(createArgs.metadata.promptHash.length).toBeGreaterThan(20);
  });
});
