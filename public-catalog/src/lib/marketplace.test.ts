import { describe, expect, it } from 'vitest';

import type { GalleryItem } from './galleryStore';
import { buildMarketplacePayload, normalizeVisibility } from './marketplace';

function createItem(overrides: Partial<GalleryItem> = {}): GalleryItem {
  return {
    id: overrides.id || 'item-1',
    imageUrl: overrides.imageUrl || 'https://example.com/item.png',
    prompt: overrides.prompt || 'quantum skyline',
    userName: overrides.userName || 'Jose',
    catalogName: overrides.catalogName || "Jose's Catalog",
    userId: overrides.userId,
    deviceId: overrides.deviceId,
    isFavorite: overrides.isFavorite || false,
    createdAt: overrides.createdAt || '2026-08-13T10:00:00.000Z',
    isQuantumVerified: overrides.isQuantumVerified || false,
    isNft: overrides.isNft || false,
    nftId: overrides.nftId,
    visibility: overrides.visibility,
  };
}

describe('normalizeVisibility', () => {
  it('defaults unknown values to public', () => {
    expect(normalizeVisibility(undefined)).toBe('public');
    expect(normalizeVisibility('unexpected')).toBe('public');
    expect(normalizeVisibility('private')).toBe('private');
  });
});

describe('buildMarketplacePayload', () => {
  it('returns only public assets, sorted newest first, with derived creator sections', () => {
    const payload = buildMarketplacePayload({
      items: [
        createItem({
          id: 'public-older',
          userId: 'user-1',
          createdAt: '2026-08-13T10:00:00.000Z',
          visibility: 'public',
        }),
        createItem({
          id: 'private-1',
          userId: 'user-1',
          createdAt: '2026-08-13T11:00:00.000Z',
          visibility: 'private',
        }),
        createItem({
          id: 'public-newer',
          userId: 'user-1',
          createdAt: '2026-08-13T12:00:00.000Z',
          visibility: 'public',
        }),
        createItem({
          id: 'anon-1',
          userId: undefined,
          deviceId: 'device-1',
          userName: 'Anonymous Artist',
          createdAt: '2026-08-13T13:00:00.000Z',
          visibility: 'public',
        }),
        createItem({
          id: 'anon-2',
          userId: undefined,
          deviceId: 'device-1',
          userName: 'Anonymous Artist',
          createdAt: '2026-08-13T14:00:00.000Z',
          visibility: 'public',
        }),
      ],
      signups: [
        {
          id: 'signup-1',
          email: 'hidden@example.com',
          name: 'New Creator',
          createdAt: '2026-08-13T12:30:00.000Z',
        },
      ],
    });

    expect(payload.items.map((item) => item.id)).toEqual(['anon-2', 'anon-1', 'public-newer', 'public-older']);
    expect(payload.featuredCreators).toHaveLength(2);
    expect(payload.featuredCreators[0]).toEqual(
      expect.objectContaining({
        id: 'device:device-1',
        name: 'Anonymous Artist',
        itemCount: 2,
      }),
    );
    expect(payload.activeCreators[1]).toEqual(
      expect.objectContaining({
        id: 'user-1',
        name: 'Jose',
        itemCount: 2,
      }),
    );
    expect(payload.signupCards[0]).toEqual({
      id: 'signup-1',
      name: 'New Creator',
      createdAt: '2026-08-13T12:30:00.000Z',
    });
  });
});
