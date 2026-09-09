import { NextResponse } from 'next/server';

import { getGalleryItems, updateGalleryItemVisibility } from '@/lib/galleryStore';
import { normalizeVisibility } from '@/lib/marketplace';
import { readOwnerSessionFromRequest } from '@/lib/ownerSession';
import { getServiceSupabase } from '@/lib/supabase';

type RouteContext = {
  params: Promise<{ id: string }>;
};

function matchesOwner(
  session: { userId?: string; deviceId?: string },
  item: { userId?: string; deviceId?: string },
) {
  if (session.userId && item.userId && session.userId === item.userId) return true;
  if (session.deviceId && item.deviceId && session.deviceId === item.deviceId) return true;
  return false;
}

export async function POST(request: Request, context: RouteContext) {
  const ownerSession = readOwnerSessionFromRequest(request);
  if (!ownerSession?.userId && !ownerSession?.deviceId) {
    return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 });
  }

  const body = await request.json().catch(() => ({}));
  const requestedVisibility = body && typeof body === 'object' ? (body as { visibility?: unknown }).visibility : undefined;
  if (requestedVisibility !== 'public' && requestedVisibility !== 'private') {
    return NextResponse.json({ success: false, error: 'invalid_visibility' }, { status: 400 });
  }

  const { id } = await context.params;
  const visibility = normalizeVisibility(requestedVisibility);
  const supabase = getServiceSupabase({ requireServiceRole: true });

  if (supabase) {
    const { data: existing, error: existingError } = await supabase
      .from('gallery_items')
      .select('*')
      .eq('id', id)
      .single();

    if (existingError || !existing) {
      return NextResponse.json({ success: false, error: 'not_found' }, { status: 404 });
    }
    if (!matchesOwner(ownerSession, { userId: existing.user_id || undefined, deviceId: existing.device_id || undefined })) {
      return NextResponse.json({ success: false, error: 'forbidden' }, { status: 403 });
    }

    const { data: updated, error: updateError } = await supabase
      .from('gallery_items')
      .update({ visibility })
      .eq('id', id)
      .select('*')
      .single();

    if (updateError || !updated) {
      return NextResponse.json({ success: false, error: 'update_failed' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      item: {
        id: updated.id,
        imageUrl: updated.image_url,
        prompt: updated.prompt,
        userName: updated.user_name,
        catalogName: updated.catalog_name,
        userId: updated.user_id,
        deviceId: updated.device_id,
        isFavorite: updated.is_favorite,
        isQuantumVerified: updated.is_quantum_verified,
        isNft: updated.is_nft,
        nftId: updated.nft_id,
        createdAt: updated.created_at,
        visibility: normalizeVisibility(updated.visibility),
      },
    });
  }

  const existing = getGalleryItems().find((item) => item.id === id);
  if (!existing) {
    return NextResponse.json({ success: false, error: 'not_found' }, { status: 404 });
  }
  if (!matchesOwner(ownerSession, existing)) {
    return NextResponse.json({ success: false, error: 'forbidden' }, { status: 403 });
  }

  const item = updateGalleryItemVisibility(id, visibility);
  if (!item) {
    return NextResponse.json({ success: false, error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, item });
}
