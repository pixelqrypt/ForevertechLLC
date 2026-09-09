import { NextResponse } from 'next/server';

import { getGalleryItems } from '@/lib/galleryStore';
import { buildMarketplacePayload, mapGalleryItemRow, type GalleryItemRow, type SignupLike } from '@/lib/marketplace';
import { getServiceSupabase } from '@/lib/supabase';

function getSafeSignupName(user: { email?: string | null; user_metadata?: Record<string, unknown> }) {
  const metadataName =
    typeof user.user_metadata?.name === 'string' ? user.user_metadata.name.trim() : '';
  return metadataName || 'New Creator';
}

async function getMarketplaceItems() {
  const supabase = getServiceSupabase({ requireServiceRole: true });
  if (!supabase) return getGalleryItems();

  const galleryResult = await supabase
    .from('gallery_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (galleryResult.error || !Array.isArray(galleryResult.data)) {
    return getGalleryItems();
  }

  return galleryResult.data.map((item) => mapGalleryItemRow(item as GalleryItemRow));
}

async function getSignupCards() {
  const supabase = getServiceSupabase({ requireServiceRole: true });
  if (!supabase) return [] as SignupLike[];

  try {
    const { data, error } = await supabase.auth.admin.listUsers();
    if (error) return [] as SignupLike[];

    return (data?.users || []).map((user) => ({
      id: user.id,
      name: getSafeSignupName(user),
      email: '',
      createdAt: user.created_at || new Date(0).toISOString(),
    }));
  } catch {
    return [] as SignupLike[];
  }
}

export async function GET() {
  const [items, signups] = await Promise.all([getMarketplaceItems(), getSignupCards()]);

  return NextResponse.json({
    success: true,
    ...buildMarketplacePayload({ items, signups }),
  });
}
