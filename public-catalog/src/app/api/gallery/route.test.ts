import { beforeEach, describe, expect, it, vi } from 'vitest';

const getGalleryItemsMock = vi.fn();
const addGalleryItemMock = vi.fn();

vi.mock('@/lib/galleryStore', () => ({
  getGalleryItems: () => getGalleryItemsMock(),
  addGalleryItem: (...args: unknown[]) => addGalleryItemMock(...args),
}));

vi.mock('@/lib/supabase', () => ({
  getServiceSupabase: () => null,
}));

import { signOwnerSession } from '@/lib/ownerSession';
import { GET, POST } from './route';

describe('gallery route', () => {
  beforeEach(() => {
    getGalleryItemsMock.mockReset();
    addGalleryItemMock.mockReset();
  });

  it('returns gallery items with normalized visibility', async () => {
    getGalleryItemsMock.mockReturnValue([
      {
        id: 'gal_1',
        imageUrl: 'https://example.com/generated.png',
        prompt: 'public art',
        userName: 'Jose',
        catalogName: "Jose's Catalog",
        userId: 'user-1',
        isFavorite: false,
        createdAt: '2026-08-13T12:00:00.000Z',
        visibility: undefined,
      },
    ]);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.items[0].visibility).toBe('public');
  });

  it('trusts the signed owner session over request-body userId and persists visibility', async () => {
    addGalleryItemMock.mockImplementation((payload) => ({
      id: 'gal_1',
      ...payload,
      isFavorite: false,
      createdAt: '2026-08-13T12:00:00.000Z',
    }));

    const req = new Request('http://localhost/api/gallery', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `ft_owner_session=${signOwnerSession({ userId: 'user-1', deviceId: 'device-1' })}`,
      },
      body: JSON.stringify({
        imageUrl: 'https://example.com/generated.png',
        prompt: 'marketplace-ready art',
        userName: 'Jose',
        catalogName: "Jose's Catalog",
        userId: 'spoofed-user',
        deviceId: 'device-1',
        visibility: 'private',
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(addGalleryItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user-1',
        deviceId: 'device-1',
        visibility: 'private',
      }),
    );
    expect(json.item.userId).toBe('user-1');
    expect(json.item.visibility).toBe('private');
  });

  it('allows anonymous device ownership without trusting a spoofed userId', async () => {
    addGalleryItemMock.mockImplementation((payload) => ({
      id: 'gal_anon',
      ...payload,
      isFavorite: false,
      createdAt: '2026-08-13T12:30:00.000Z',
    }));

    const req = new Request('http://localhost/api/gallery', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        imageUrl: 'https://example.com/generated.png',
        prompt: 'anonymous marketplace art',
        userName: 'Anonymous Artist',
        catalogName: 'Anonymous Catalog',
        userId: 'spoofed-user',
        deviceId: 'device-2',
      }),
    });

    const res = await POST(req);
    const json = await res.json();

    expect(addGalleryItemMock).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: undefined,
        deviceId: 'device-2',
        visibility: 'public',
      }),
    );
    expect(json.item.userId).toBeUndefined();
    expect(json.item.deviceId).toBe('device-2');
    expect(json.item.visibility).toBe('public');
  });
});
