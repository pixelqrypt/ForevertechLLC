import { createHash } from 'crypto';

import Stripe from 'stripe';

import { getStripeClient } from '@/lib/checkoutRuntime';

function getString(value: unknown, maxLen = 500): string {
  const text = typeof value === 'string' ? value : '';
  const trimmed = text.trim();
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}

export function normalizeQuantumPrompt(prompt: unknown): string {
  return getString(prompt).replace(/\s+/g, ' ');
}

export function hashQuantumPrompt(prompt: unknown): string {
  return createHash('sha256').update(normalizeQuantumPrompt(prompt)).digest('hex');
}

export type QuantumGenerationVerificationResult =
  | { success: true; session: Stripe.Checkout.Session }
  | { success: false; error: string; status: number };

export async function verifyQuantumGenerationSession(params: {
  sessionId: unknown;
  deviceId: unknown;
  prompt: unknown;
}): Promise<QuantumGenerationVerificationResult> {
  const sessionId = getString(params.sessionId, 128);
  const deviceId = getString(params.deviceId, 128);
  const prompt = normalizeQuantumPrompt(params.prompt);

  if (!sessionId || !deviceId || !prompt) {
    return { success: false, error: 'missing_params', status: 400 };
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  const paid = session.payment_status === 'paid' || session.status === 'complete';
  if (!paid) {
    return { success: false, error: 'not_paid', status: 402 };
  }

  const quantumType = getString(session.metadata?.quantumType, 64);
  if (quantumType && quantumType !== 'image_generation') {
    return { success: false, error: 'invalid_quantum_session', status: 403 };
  }

  const sessionDeviceId = getString(session.metadata?.deviceId, 128);
  if (sessionDeviceId && sessionDeviceId !== deviceId) {
    return { success: false, error: 'device_mismatch', status: 403 };
  }

  const promptHash = getString(session.metadata?.promptHash, 128);
  if (promptHash && promptHash !== hashQuantumPrompt(prompt)) {
    return { success: false, error: 'prompt_mismatch', status: 403 };
  }

  return { success: true, session };
}
