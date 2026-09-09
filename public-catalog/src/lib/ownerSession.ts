import { createHmac, timingSafeEqual } from 'node:crypto';

import { NextResponse } from 'next/server';

export const OWNER_SESSION_COOKIE = 'ft_owner_session';

export type OwnerSessionIdentity = {
  userId?: string;
  deviceId?: string;
};

function normalizeIdentityValue(value: unknown) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed || trimmed === 'anonymous') return '';
  return trimmed;
}

function getOwnerSessionSecret() {
  return (process.env.OWNER_SESSION_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'dev-owner-session-secret').trim();
}

function encodePayload(identity: OwnerSessionIdentity) {
  return Buffer.from(
    JSON.stringify({
      userId: normalizeIdentityValue(identity.userId) || undefined,
      deviceId: normalizeIdentityValue(identity.deviceId) || undefined,
    }),
  ).toString('base64url');
}

function signPayload(payload: string) {
  return createHmac('sha256', getOwnerSessionSecret()).update(payload).digest('base64url');
}

export function signOwnerSession(identity: OwnerSessionIdentity) {
  const payload = encodePayload(identity);
  return `${payload}.${signPayload(payload)}`;
}

export function verifyOwnerSession(token: string): OwnerSessionIdentity | null {
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return null;

  const expected = signPayload(payload);
  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);
  if (expectedBuffer.length !== signatureBuffer.length) return null;
  if (!timingSafeEqual(expectedBuffer, signatureBuffer)) return null;

  try {
    const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      userId?: unknown;
      deviceId?: unknown;
    };
    const userId = normalizeIdentityValue(decoded.userId);
    const deviceId = normalizeIdentityValue(decoded.deviceId);
    if (!userId && !deviceId) return null;
    return {
      userId: userId || undefined,
      deviceId: deviceId || undefined,
    };
  } catch {
    return null;
  }
}

function readCookieValue(cookieHeader: string, key: string) {
  const cookies = cookieHeader.split(';');
  for (const entry of cookies) {
    const [name, ...rest] = entry.trim().split('=');
    if (name === key) return rest.join('=');
  }
  return '';
}

export function readOwnerSessionFromRequest(request: Request) {
  const cookieHeader = request.headers.get('cookie') || '';
  const token = readCookieValue(cookieHeader, OWNER_SESSION_COOKIE);
  if (!token) return null;
  return verifyOwnerSession(token);
}

export function applyOwnerSession(response: NextResponse, identity: OwnerSessionIdentity) {
  const userId = normalizeIdentityValue(identity.userId);
  const deviceId = normalizeIdentityValue(identity.deviceId);
  if (!userId && !deviceId) {
    clearOwnerSession(response);
    return response;
  }

  response.cookies.set({
    name: OWNER_SESSION_COOKIE,
    value: signOwnerSession({ userId, deviceId }),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export function clearOwnerSession(response: NextResponse) {
  response.cookies.set({
    name: OWNER_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
  return response;
}
