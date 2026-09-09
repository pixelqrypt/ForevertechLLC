import type { GalleryItem } from '@/lib/galleryStore';

export type MarketplaceSignupCard = {
  id: string;
  name: string;
  createdAt: string;
};

export type MarketplaceCreatorCard = {
  id: string;
  name: string;
  itemCount: number;
  latestAssetCreatedAt: string;
};

export type MarketplacePayload = {
  items: GalleryItem[];
  signupCards: MarketplaceSignupCard[];
  featuredCreators: MarketplaceCreatorCard[];
  activeCreators: MarketplaceCreatorCard[];
};

export type SignupLike = {
  id: string;
  email?: string;
  name: string;
  createdAt: string;
};

export type GalleryItemRow = {
  id: string;
  image_url: string;
  prompt: string;
  user_name: string;
  catalog_name: string;
  user_id?: string | null;
  device_id?: string | null;
  is_favorite?: boolean | null;
  is_quantum_verified?: boolean | null;
  is_nft?: boolean | null;
  nft_id?: string | null;
  created_at: string;
  visibility?: string | null;
};

export function normalizeVisibility(value: unknown): 'public' | 'private' {
  return value === 'private' ? 'private' : 'public';
}

export function mapGalleryItemRow(item: GalleryItemRow): GalleryItem {
  return {
    id: item.id,
    imageUrl: item.image_url,
    prompt: item.prompt,
    userName: item.user_name,
    catalogName: item.catalog_name,
    userId: item.user_id || undefined,
    deviceId: item.device_id || undefined,
    isFavorite: Boolean(item.is_favorite),
    isQuantumVerified: Boolean(item.is_quantum_verified),
    isNft: Boolean(item.is_nft),
    nftId: item.nft_id || undefined,
    createdAt: item.created_at,
    visibility: normalizeVisibility(item.visibility),
  };
}

function getMarketplaceCreatorKey(item: GalleryItem): string {
  if (item.userId && item.userId !== 'anonymous') return item.userId;
  if (item.deviceId) return `device:${item.deviceId}`;
  return `anonymous:item:${item.id}`;
}

function getSignupName(signup: SignupLike): string {
  const name = typeof signup.name === 'string' ? signup.name.trim() : '';
  return name || 'New Creator';
}

export function buildMarketplacePayload(input: {
  items: GalleryItem[];
  signups: SignupLike[];
}): MarketplacePayload {
  const publicItems = [...input.items]
    .filter((item) => normalizeVisibility(item.visibility) === 'public')
    .map((item) => ({ ...item, visibility: normalizeVisibility(item.visibility) }))
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  const byCreator = new Map<string, MarketplaceCreatorCard>();
  for (const item of publicItems) {
    const key = getMarketplaceCreatorKey(item);
    const existing = byCreator.get(key);
    const latestAssetCreatedAt =
      existing && Date.parse(existing.latestAssetCreatedAt) > Date.parse(item.createdAt)
        ? existing.latestAssetCreatedAt
        : item.createdAt;

    byCreator.set(key, {
      id: key,
      name: item.userName,
      itemCount: (existing?.itemCount || 0) + 1,
      latestAssetCreatedAt,
    });
  }

  const creators = Array.from(byCreator.values()).sort(
    (a, b) => Date.parse(b.latestAssetCreatedAt) - Date.parse(a.latestAssetCreatedAt),
  );

  return {
    items: publicItems,
    signupCards: [...input.signups]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 6)
      .map((signup) => ({
        id: signup.id,
        name: getSignupName(signup),
        createdAt: signup.createdAt,
      })),
    featuredCreators: creators.slice(0, 6),
    activeCreators: creators.slice(0, 8),
  };
}
