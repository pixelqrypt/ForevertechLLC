import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { getGalleryItems, addGalleryItem } from '@/lib/galleryStore';
import { mapGalleryItemRow, normalizeVisibility } from '@/lib/marketplace';
import { applyOwnerSession, readOwnerSessionFromRequest } from '@/lib/ownerSession';

function getString(value: unknown, fallback = '') {
  return typeof value === 'string' && value.trim() ? value : fallback;
}

function getBoolean(value: unknown) {
  return value === true;
}

function getTrustedOwnerIdentity(request: Request, body: Record<string, unknown>) {
  const ownerSession = readOwnerSessionFromRequest(request);
  const trustedUserId = ownerSession?.userId || undefined;
  const deviceId = getString(body.deviceId) || undefined;

  return {
    userId: trustedUserId,
    deviceId,
  };
}

function getGalleryResponseItem(item: Record<string, unknown>) {
  return {
    ...item,
    visibility: normalizeVisibility(item.visibility),
  };
}

export async function GET() {
  const supabase = getServiceSupabase();
  
  if (supabase) {
    const { data, error } = await supabase
      .from('gallery_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    const items = data.map((item) => mapGalleryItemRow(item));

    return NextResponse.json({ success: true, items });
  } else {
    // Fallback to in-memory store if Supabase isn't configured
    return NextResponse.json({
      success: true,
      items: getGalleryItems().map((item) => getGalleryResponseItem(item as unknown as Record<string, unknown>)),
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const supabase = getServiceSupabase();
    const trustedOwner = getTrustedOwnerIdentity(request, body);
    const visibility = normalizeVisibility(body.visibility);
    const imageUrl = getString(body.imageUrl);
    const prompt = getString(body.prompt, 'Generated Image');
    const userName = getString(body.userName, 'Anonymous User');
    const catalogName = getString(body.catalogName, 'Default Catalog');
    const isQuantumVerified = getBoolean(body.isQuantumVerified);
    const isNft = getBoolean(body.isNft);
    const nftId = getString(body.nftId) || undefined;

    if (supabase) {
      const { data, error } = await supabase
        .from('gallery_items')
        .insert({
          image_url: imageUrl,
          prompt,
          user_name: userName,
          catalog_name: catalogName,
          user_id: trustedOwner.userId || null,
          device_id: trustedOwner.deviceId || undefined,
          is_quantum_verified: isQuantumVerified,
          is_nft: isNft,
          nft_id: nftId,
          visibility,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      const response = NextResponse.json({ success: true, item: mapGalleryItemRow(data) });
      applyOwnerSession(response, {
        userId: data.user_id || trustedOwner.userId,
        deviceId: data.device_id || trustedOwner.deviceId,
      });
      return response;
    } else {
      // Fallback to in-memory store if Supabase isn't configured
      const newItem = addGalleryItem({
        imageUrl,
        prompt,
        userName,
        catalogName,
        userId: trustedOwner.userId,
        deviceId: trustedOwner.deviceId || undefined,
        isQuantumVerified,
        isNft,
        nftId,
        visibility,
      });
      const response = NextResponse.json({ success: true, item: newItem });
      applyOwnerSession(response, trustedOwner);
      return response;
    }
  } catch (error) {
    console.error('Failed to add gallery item', error);
    return NextResponse.json({ success: false, error: 'Failed to add to gallery' }, { status: 500 });
  }
}
