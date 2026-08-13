import { NextResponse } from 'next/server';
import { OWNER_BRAND, PRIMARY_BRAND } from '@/lib/brand';
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
    const stripe = getStripeClient();
    const body: unknown = await request.json().catch(() => ({} as unknown));
    const b = isRecord(body) ? body : {};

    const code = getString(b.code, 128);
    const deviceId = getString(b.deviceId, 128) || 'anonymous';
    const userId = getString(b.userId, 128);
    const email = getString(b.email, 256);
    const galleryItemId = getString(b.galleryItemId, 64);
    const creatorUserId = getString(b.creatorUserId, 128);
    const creatorStripeAccountId = getString(b.creatorStripeAccountId, 64);

    if (!code) return NextResponse.json({ error: 'Missing code' }, { status: 400 });

    const origin = getRequestOrigin(request);
    if (!origin) return NextResponse.json({ error: 'Missing site origin. Set NEXT_PUBLIC_SITE_URL.' }, { status: 500 });

    const priceEnv = (process.env.PIXELQRYPT_DOWNLOAD_PRICE_CENTS || '').trim();
    const priceRaw = priceEnv ? Number(priceEnv) : 799;
    const unitAmount = Number.isFinite(priceRaw) ? Math.max(0, Math.min(100_000, Math.trunc(priceRaw))) : 799;
    const payoutRate = 0.45;
    const creatorPayoutCents =
      creatorUserId && unitAmount > 0 ? Math.max(0, Math.min(unitAmount, Math.trunc(unitAmount * payoutRate))) : 0;
    const platformFeeCents =
      creatorUserId && unitAmount > 0 ? Math.max(0, Math.min(unitAmount, unitAmount - creatorPayoutCents)) : 0;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: { name: `${PRIMARY_BRAND} Download Access by ${OWNER_BRAND}` },
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${origin}/pixelqrypt?code=${encodeURIComponent(code)}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pixelqrypt?code=${encodeURIComponent(code)}`,
      customer_email: email || undefined,
      metadata: {
        origin,
        deviceId,
        userId,
        pixelqryptCode: code,
        pixelqryptType: 'download',
        galleryItemId,
        creatorUserId,
        creatorStripeAccountId,
        payoutRate: creatorUserId ? String(payoutRate) : '',
        creatorPayoutCents: creatorUserId ? String(creatorPayoutCents) : '',
        platformFeeCents: creatorUserId ? String(platformFeeCents) : '',
      },
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (e: unknown) {
    const checkoutError = getCheckoutErrorResponse(e);
    return NextResponse.json({ error: checkoutError.error }, { status: checkoutError.status });
  }
}
