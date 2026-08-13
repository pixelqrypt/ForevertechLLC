import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createHash } from 'crypto';
import { NextRequest } from 'next/server';

const { retrieveSessionMock, getQuantumSeedMock } = vi.hoisted(() => ({
  retrieveSessionMock: vi.fn(),
  getQuantumSeedMock: vi.fn(async () => ({
    success: true,
    data: {
      provider: 'ibm',
      jobId: 'job-1',
      backend: 'ibmq_test',
      seed: 42,
      shots: 1024,
      createdAt: '2026-08-13T00:00:00.000Z',
    },
  })),
}));

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

vi.mock('@/lib/quantum-seed', () => ({
  getQuantumSeed: getQuantumSeedMock,
}));

import { POST } from './image/route';

function makeReq(body: unknown) {
  return new NextRequest('http://localhost/api/generate/image', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}

describe('image route quantum payment gate', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    retrieveSessionMock.mockClear();
    getQuantumSeedMock.mockClear();
    globalThis.fetch = originalFetch;
  });

  it('rejects real quantum generation when no paid checkout session is supplied', async () => {
    const res = await POST(makeReq({ prompt: 'hello', provider: 'mock', quantum_mode: true, device_id: 'device-1' }));
    const json = await res.json();

    expect(res.status).toBe(402);
    expect(json.success).toBe(false);
    expect(json.error).toBe('quantum_payment_required');
    expect(getQuantumSeedMock).not.toHaveBeenCalled();
  });

  it('allows real quantum generation after verifying a paid session for the same prompt and device', async () => {
    const prompt = 'hello';
    retrieveSessionMock.mockResolvedValue({
      id: 'cs_test_quantum',
      status: 'complete',
      payment_status: 'paid',
      metadata: {
        deviceId: 'device-1',
        quantumType: 'image_generation',
        promptHash: createHash('sha256').update(prompt).digest('hex'),
      },
    });
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        imageUrl: '/uploads/test.png',
        meta: { provider: 'fusion' },
      }),
    })) as typeof fetch;

    const res = await POST(
      makeReq({
        prompt,
        quantum_mode: true,
        quantum_session_id: 'cs_test_quantum',
        device_id: 'device-1',
      }),
    );
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.quantum_provenance).toEqual(
      expect.objectContaining({
        provider: 'ibm',
        backend: 'ibmq_test',
        seed: 42,
      }),
    );
    expect(getQuantumSeedMock).toHaveBeenCalledTimes(1);
  });
});
