import { NextResponse } from 'next/server';

import { verifyQuantumGenerationSession } from '@/lib/quantumGenerationCheckout';

function getString(value: unknown, maxLen = 400): string {
  const text = typeof value === 'string' ? value : '';
  const trimmed = text.trim();
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = getString(searchParams.get('session_id'), 128);
    const deviceId = getString(searchParams.get('deviceId'), 128);
    const prompt = getString(searchParams.get('prompt'));

    const verification = await verifyQuantumGenerationSession({
      sessionId,
      deviceId,
      prompt,
    });

    if (!verification.success) {
      return NextResponse.json({ success: false, error: verification.error }, { status: verification.status });
    }

    return NextResponse.json({
      success: true,
      unlocked: true,
      sessionId,
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'internal_error' },
      { status: 500 },
    );
  }
}
