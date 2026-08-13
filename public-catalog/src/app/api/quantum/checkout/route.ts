import { NextResponse } from 'next/server';

import { OWNER_BRAND, PRIMARY_BRAND } from '@/lib/brand';
import { getCheckoutErrorResponse, getRequestOrigin, getStripeClient } from '@/lib/checkoutRuntime';
import { hashQuantumPrompt, normalizeQuantumPrompt } from '@/lib/quantumGenerationCheckout';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getString(value: unknown, maxLen = 400): string {
  const text = typeof value === 'string' ? value : '';
  const trimmed = text.trim();
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}

export async function POST(request: Request) {
  try {
    const stripe = getStripeClient();
    const body: unknown = await request.json().catch(() => ({} as unknown));
    const payload = isRecord(body) ? body : {};

    const prompt = normalizeQuantumPrompt(payload.prompt);
    const deviceId = getString(payload.deviceId, 128) || 'anonymous';
    const userId = getString(payload.userId, 128);
    const email = getString(payload.email, 256);

    if (!prompt) {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }

    const origin = getRequestOrigin(request);
    if (!origin) {
      return NextResponse.json({ error: 'Missing site origin. Set NEXT_PUBLIC_SITE_URL.' }, { status: 500 });
    }

    const priceEnv = (process.env.STRIPE_QUANTUM_GENERATION_PRICE_CENTS || '').trim();
    const priceRaw = priceEnv ? Number(priceEnv) : 999;
    const unitAmount = Number.isFinite(priceRaw) ? Math.max(0, Math.min(100_000, Math.trunc(priceRaw))) : 999;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${PRIMARY_BRAND} Real Quantum Generation by ${OWNER_BRAND}`,
            },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/studio?quantum_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/studio`,
      customer_email: email || undefined,
      metadata: {
        deviceId,
        userId,
        quantumType: 'image_generation',
        promptHash: hashQuantumPrompt(prompt),
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (error: unknown) {
    const checkoutError = getCheckoutErrorResponse(error);
    return NextResponse.json({ error: checkoutError.error }, { status: checkoutError.status });
  }
}
