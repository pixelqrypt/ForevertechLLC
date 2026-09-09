import { beforeEach, describe, expect, it, vi } from 'vitest';

const getGalleryItemsMock = vi.fn();
const getServiceSupabaseMock = vi.fn();

vi.mock('@/lib/galleryStore', () => ({
  getGalleryItems: () => getGalleryItemsMock(),
}));

vi.mock('@/lib/supabase', () => ({
  getServiceSupabase: (...args: unknown[]) => getServiceSupabaseMock(...args),
}));

import { GET } from './route';

describe('GET /api/marketplace', () => {
  beforeEach(() => {
    getGalleryItemsMock.mockReset();
    getServiceSupabaseMock.mockReset();
  });

  it('returns only public items and privacy-safe signup cards', async () => {
    getGalleryItemsMock.mockReturnValue([
      {
        id: 'public-1',
        imageUrl: 'https://example.com/public-1.png',
        prompt: 'quantum skyline',
        userName: 'Jose',
        catalogName: "Jose's Catalog",
        userId: 'user-1',
        isFavorite: false,
        createdAt: '2026-08-13T10:00:00.000Z',
        visibility: 'public',
      },
      {
        id: 'private-1',
        imageUrl: 'https://example.com/private-1.png',
        prompt: 'private render',
        userName: 'Jose',
        catalogName: "Jose's Catalog",
        userId: 'user-1',
        isFavorite: false,
        createdAt: '2026-08-13T09:00:00.000Z',
        visibility: 'private',
      },
    ]);

    getServiceSupabaseMock.mockReturnValue({
      auth: {
        admin: {
          listUsers: vi.fn(async () => ({
            data: {
              users: [
                {
                  id: 'signup-1',
                  email: 'hidden@example.com',
                  created_at: '2026-08-13T11:00:00.000Z',
                  user_metadata: {},
                },
              ],
            },
            error: null,
          })),
        },
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          order: vi.fn(async () => ({ data: null, error: new Error('no gallery table read in test') })),
        })),
      })),
    });

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.items).toHaveLength(1);
    expect(json.items[0].id).toBe('public-1');
    expect(json.signupCards).toEqual([
      {
        id: 'signup-1',
        name: 'New Creator',
        createdAt: '2026-08-13T11:00:00.000Z',
      },
    ]);
    expect(JSON.stringify(json)).not.toContain('hidden@example.com');
  });
});
