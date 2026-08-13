import { beforeEach, describe, expect, it, vi } from 'vitest';

const createSessionMock = vi.fn(async () => ({ id: 'cs_test_1', url: 'https://stripe.test/checkout' }));

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

describe('pixelqrypt checkout route', () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    delete process.env.NEXT_PUBLIC_SITE_URL;
    createSessionMock.mockClear();
  });

  it('creates a branded PixelQrypt checkout session using the forwarded request origin', async () => {
    const req = new Request('http://local/api/pixelqrypt/checkout', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-host': 'pixelqrypt.com',
        'x-forwarded-proto': 'https',
      },
      body: JSON.stringify({ code: 'ABC123', deviceId: 'device-1' }),
    });

    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(createSessionMock).toHaveBeenCalledTimes(1);

    const createArgs = createSessionMock.mock.calls[0][0];
    expect(createArgs.success_url).toMatch(/^https:\/\/pixelqrypt\.com\/pixelqrypt/);
    expect(createArgs.line_items[0].price_data.product_data.name).toBe('PixelQrypt Download Access by ForeverTech LLC');
  });
});
