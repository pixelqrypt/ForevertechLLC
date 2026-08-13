import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'crypto';

const retrieveSessionMock = vi.fn();

vi.mock('stripe', () => {
  return {
    default: class StripeMock {
      checkout = {
        sessions: {
          retrieve: retrieveSessionMock,
        },
      };
      constructor() {}
    },
  };
});

import { GET } from './route';

describe('quantum confirm route', () => {
  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    retrieveSessionMock.mockClear();
  });

  it('confirms a paid quantum session when the device and prompt match', async () => {
    const prompt = 'quantum wormhole fractal';
    const promptHash = createHash('sha256').update(prompt.trim()).digest('hex');
    retrieveSessionMock.mockResolvedValue({
      id: 'cs_test_quantum',
      status: 'complete',
      payment_status: 'paid',
      metadata: {
        deviceId: 'device-1',
        quantumType: 'image_generation',
        promptHash,
      },
    });

    const req = new Request(
      `http://local/api/quantum/confirm?session_id=cs_test_quantum&deviceId=device-1&prompt=${encodeURIComponent(prompt)}`,
    );
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.unlocked).toBe(true);
    expect(json.sessionId).toBe('cs_test_quantum');
  });
});
