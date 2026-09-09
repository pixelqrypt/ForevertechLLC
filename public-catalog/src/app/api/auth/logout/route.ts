import { NextResponse } from 'next/server';

import { clearOwnerSession } from '@/lib/ownerSession';

export async function POST() {
  const response = NextResponse.json({ success: true }, { status: 200 });
  clearOwnerSession(response);
  return response;
}
