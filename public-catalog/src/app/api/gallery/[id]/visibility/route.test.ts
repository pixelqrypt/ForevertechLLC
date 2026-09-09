import { beforeEach, describe, expect, it, vi } from 'vitest';

const getGalleryItemsMock = vi.fn();
const updateGalleryItemVisibilityMock = vi.fn();

vi.mock('@/lib/galleryStore', () => ({
  getGalleryItems: () => getGalleryItemsMock(),
  updateGalleryItemVisibility: (...args: unknown[]) => updateGalleryItemVisibilityMock(...args),
}));

vi.mock('@/lib/supabase', () => ({
  getServiceSupabase: () => null,
}));

import { signOwnerSession } from '@/lib/ownerSession';
import { POST } from './route';

describe('POST /api/gallery/[id]/visibility', () => {
  beforeEach(() => {
    getGalleryItemsMock.mockReset();
    updateGalleryItemVisibilityMock.mockReset();

    getGalleryItemsMock.mockReturnValue([
      {
        id: 'gal_1',
        imageUrl: 'https://example.com/generated.png',
        prompt: 'public art',
        userName: 'Jose',
        catalogName: "Jose's Catalog",
        userId: 'user-1',
        deviceId: 'device-1',
        isFavorite: false,
        createdAt: '2026-08-13T12:00:00.000Z',
        visibility: 'public',
      },
    ]);

    updateGalleryItemVisibilityMock.mockReturnValue({
      id: 'gal_1',
      visibility: 'private',
    });
  });

  it('updates an item when the signed owner session matches the item owner', async () => {
    const req = new Request('http://localhost/api/gallery/gal_1/visibility', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `ft_owner_session=${signOwnerSession({ userId: 'user-1', deviceId: 'device-1' })}`,
      },
      body: JSON.stringify({ visibility: 'private' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: 'gal_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(updateGalleryItemVisibilityMock).toHaveBeenCalledWith('gal_1', 'private');
    expect(json.item.visibility).toBe('private');
  });

  it('rejects requests without a trusted owner session', async () => {
    const req = new Request('http://localhost/api/gallery/gal_1/visibility', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ visibility: 'private' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: 'gal_1' }) });

    expect(res.status).toBe(401);
  });

  it('rejects owner mismatches and invalid visibility values', async () => {
    const mismatchReq = new Request('http://localhost/api/gallery/gal_1/visibility', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `ft_owner_session=${signOwnerSession({ userId: 'user-2' })}`,
      },
      body: JSON.stringify({ visibility: 'private' }),
    });

    const mismatchRes = await POST(mismatchReq, { params: Promise.resolve({ id: 'gal_1' }) });
    expect(mismatchRes.status).toBe(403);

    const invalidReq = new Request('http://localhost/api/gallery/gal_1/visibility', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        cookie: `ft_owner_session=${signOwnerSession({ userId: 'user-1' })}`,
      },
      body: JSON.stringify({ visibility: 'friends-only' }),
    });

    const invalidRes = await POST(invalidReq, { params: Promise.resolve({ id: 'gal_1' }) });
    expect(invalidRes.status).toBe(400);
  });
});
