import Stripe from 'stripe';

export class CheckoutConfigError extends Error {}

export class InvalidCheckoutRequestError extends Error {}

export function getStripeClient() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new CheckoutConfigError('Stripe checkout is not configured.');
  }
  return new Stripe(secretKey);
}

export function getRequestOrigin(request: Request): string {
  const env = (process.env.NEXT_PUBLIC_SITE_URL || '').trim();
  if (env) return env.replace(/\/$/, '');

  const hostHeader = (request.headers.get('x-forwarded-host') || request.headers.get('host') || '').trim();
  const host = hostHeader.split(',')[0]?.trim() || '';
  const protoHeader = (request.headers.get('x-forwarded-proto') || '').trim();
  const proto = protoHeader.split(',')[0]?.trim() || '';
  if (host) return `${proto || 'https'}://${host}`;

  const origin = (request.headers.get('origin') || '').trim();
  if (origin) return origin.replace(/\/$/, '');

  return process.env.NODE_ENV !== 'production' ? 'http://localhost:3001' : '';
}

export function getCheckoutErrorResponse(error: unknown): { error: string; status: number } {
  if (error instanceof InvalidCheckoutRequestError) {
    return { error: error.message, status: 400 };
  }
  if (error instanceof CheckoutConfigError) {
    return { error: error.message, status: 503 };
  }
  const message = error instanceof Error ? error.message : 'An unknown error occurred';
  return { error: message, status: 500 };
}
