import { NextResponse } from 'next/server';
import { getCheckoutErrorResponse, getRequestOrigin, getStripeClient } from '@/lib/checkoutRuntime';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getString(v: unknown, maxLen = 400): string {
  const s = typeof v === 'string' ? v : '';
  const t = s.trim();
  return t.length > maxLen ? t.slice(0, maxLen) : t;
}

export async function POST(request: Request) {
  try {
    const priceId = (process.env.STRIPE_PREMIUM_CREATOR_PRICE_ID || '').trim();
    if (!priceId) {
      return NextResponse.json({ error: 'Missing STRIPE_PREMIUM_CREATOR_PRICE_ID' }, { status: 500 });
    }

    const stripe = getStripeClient();
    const body: unknown = await request.json().catch(() => ({} as unknown));
    const b = isRecord(body) ? body : {};

    const userId = getString(b.userId, 128);
    const email = getString(b.email, 256);

    if (!userId) return NextResponse.json({ error: 'Missing userId' }, { status: 400 });

    const origin = getRequestOrigin(request);
    if (!origin) return NextResponse.json({ error: 'Missing site origin. Set NEXT_PUBLIC_SITE_URL.' }, { status: 500 });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${origin}/profile?creator_session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/profile?upgrade=premium-creator`,
      customer_email: email || undefined,
      metadata: {
        premiumType: 'premium_creator',
        userId,
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (e: unknown) {
    const checkoutError = getCheckoutErrorResponse(e);
    return NextResponse.json({ error: checkoutError.error }, { status: checkoutError.status });
  }
}
