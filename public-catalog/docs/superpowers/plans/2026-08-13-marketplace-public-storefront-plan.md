# Marketplace Public Storefront Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new public `Marketplace` page that shows public sale-ready assets, creator/signup social proof, and a quantum-vs-standard sales section while keeping `/gallery` as a personal owner view.

**Architecture:** Add a dedicated marketplace read route backed by gallery items plus lightweight derived creator/signup data, then add explicit `visibility` persistence so public browsing and owner controls stay separate. Reuse the current gallery storage and action vocabulary, but keep Marketplace presentation purpose-built and slimmer than owner-facing `My Gallery`.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Supabase, existing gallery/cart/auth contexts

---

## File Structure

### New Files

- `src/lib/marketplace.ts`
  - shared marketplace types and derivation helpers for public items, featured creators, active creators, and signup cards
- `src/lib/marketplace.test.ts`
  - focused unit coverage for public filtering and derived sections
- `src/app/api/marketplace/route.ts`
  - dedicated public marketplace read endpoint
- `src/app/api/marketplace/route.test.ts`
  - endpoint coverage for public filtering and social-proof payloads
- `src/app/api/gallery/[id]/visibility/route.ts`
  - owner-facing visibility update endpoint
- `src/app/api/gallery/[id]/visibility/route.test.ts`
  - endpoint coverage for public/private updates
- `src/components/marketplace/MarketplaceHero.tsx`
  - premium hero and primary CTAs
- `src/components/marketplace/QuantumComparison.tsx`
  - side-by-side standard vs real quantum sales section with arrows
- `src/components/marketplace/MarketplaceAssetGrid.tsx`
  - image-led sale cards for public assets
- `src/components/marketplace/CreatorStrip.tsx`
  - reusable creator and signup card section
- `src/app/marketplace/page.tsx`
  - new public route composition
- `src/app/marketplace/page.test.tsx`
  - page-level coverage for section order and nav/accessibility

### Modified Files

- `src/lib/galleryStore.ts`
  - add `visibility` to stored gallery items and default existing/future items to `public`
- `src/app/api/gallery/route.ts`
  - persist and return visibility on create/read
- `src/app/studio/page.tsx`
  - add visibility control to save/publish flow and include it in gallery saves
- `src/app/studio/page.test.tsx`
  - cover `visibility` payload sent from Studio
- `src/app/gallery/page.tsx`
  - add owner-facing public/private control in `My Gallery`
- `src/app/gallery/page.test.tsx`
  - cover visibility badge/toggle and optimistic refresh
- `src/components/Header.tsx`
  - add primary nav item for `Marketplace`

## Task 1: Add Shared Marketplace Derivations And Public API

**Files:**
- Create: `src/lib/marketplace.ts`
- Create: `src/lib/marketplace.test.ts`
- Create: `src/app/api/marketplace/route.ts`
- Create: `src/app/api/marketplace/route.test.ts`
- Modify: `src/lib/galleryStore.ts`
- Modify: `src/app/api/gallery/route.ts`

- [ ] **Step 1: Write the failing helper test**

```ts
import { describe, expect, it } from 'vitest';
import { buildMarketplacePayload } from './marketplace';

describe('buildMarketplacePayload', () => {
  it('returns only public sale-ready assets and derives social-proof sections', () => {
    const payload = buildMarketplacePayload({
      items: [
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
      ],
      signups: [
        { id: 'user-1', email: 'jose@example.com', name: 'Jose', createdAt: '2026-08-13T11:00:00.000Z' },
      ],
    });

    expect(payload.items).toHaveLength(1);
    expect(payload.items[0].id).toBe('public-1');
    expect(payload.signupCards[0].name).toBe('Jose');
    expect(payload.activeCreators[0].name).toBe('Jose');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/lib/marketplace.test.ts`
Expected: FAIL with module or export missing for `buildMarketplacePayload`

- [ ] **Step 3: Write minimal shared marketplace helper**

```ts
// src/lib/marketplace.ts
import type { GalleryItem } from '@/lib/galleryStore';

export type MarketplaceSignupCard = {
  id: string;
  name: string;
  email: string;
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

type SignupLike = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export function normalizeVisibility(value: unknown): 'public' | 'private' {
  return value === 'private' ? 'private' : 'public';
}

export function buildMarketplacePayload(input: {
  items: GalleryItem[];
  signups: SignupLike[];
}): MarketplacePayload {
  const publicItems = [...input.items]
    .filter((item) => normalizeVisibility(item.visibility) === 'public')
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));

  const byCreator = new Map<string, MarketplaceCreatorCard>();
  for (const item of publicItems) {
    const key = item.userId || item.userName;
    const existing = byCreator.get(key);
    const nextLatest = existing
      ? (Date.parse(item.createdAt) > Date.parse(existing.latestAssetCreatedAt) ? item.createdAt : existing.latestAssetCreatedAt)
      : item.createdAt;
    byCreator.set(key, {
      id: key,
      name: item.userName,
      itemCount: (existing?.itemCount || 0) + 1,
      latestAssetCreatedAt: nextLatest,
    });
  }

  const creators = Array.from(byCreator.values()).sort(
    (a, b) => Date.parse(b.latestAssetCreatedAt) - Date.parse(a.latestAssetCreatedAt),
  );

  return {
    items: publicItems,
    signupCards: [...input.signups]
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
      .slice(0, 6),
    featuredCreators: creators.slice(0, 6),
    activeCreators: creators.slice(0, 8),
  };
}
```

- [ ] **Step 4: Run helper test to verify it passes**

Run: `npm test -- src/lib/marketplace.test.ts`
Expected: PASS with `1 passed`

- [ ] **Step 5: Write the failing marketplace route test**

```ts
import { describe, expect, it, vi } from 'vitest';
import { GET } from './route';

vi.mock('@/lib/galleryStore', () => ({
  getGalleryItems: () => [
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
  ],
}));

vi.mock('@/lib/supabase', () => ({
  getServiceSupabase: () => null,
}));

describe('GET /api/marketplace', () => {
  it('returns only public items', async () => {
    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.items).toHaveLength(1);
    expect(json.items[0].id).toBe('public-1');
  });
});
```

- [ ] **Step 6: Run route test to verify it fails**

Run: `npm test -- src/app/api/marketplace/route.test.ts`
Expected: FAIL with missing route

- [ ] **Step 7: Write minimal marketplace route and gallery visibility persistence**

```ts
// src/lib/galleryStore.ts
export interface GalleryItem {
  id: string;
  imageUrl: string;
  prompt: string;
  userName: string;
  catalogName: string;
  userId?: string;
  deviceId?: string;
  isFavorite: boolean;
  createdAt: string;
  isQuantumVerified?: boolean;
  isNft?: boolean;
  nftId?: string;
  visibility?: 'public' | 'private';
}

export const addGalleryItem = (
  item: Omit<GalleryItem, 'id' | 'createdAt' | 'isFavorite'> & Partial<Pick<GalleryItem, 'isFavorite'>>
) => {
  const newItem: GalleryItem = {
    ...item,
    id: `gal_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: new Date().toISOString(),
    isFavorite: item.isFavorite || false,
    visibility: item.visibility === 'private' ? 'private' : 'public',
  };
  global.galleryStore = [newItem, ...global.galleryStore];
  return newItem;
};
```

```ts
// src/app/api/gallery/route.ts insert/update mappings
visibility: item.visibility === 'private' ? 'private' : 'public',
```

```ts
// src/app/api/marketplace/route.ts
import { NextResponse } from 'next/server';
import { getGalleryItems } from '@/lib/galleryStore';
import { buildMarketplacePayload } from '@/lib/marketplace';
import { getServiceSupabase } from '@/lib/supabase';

export async function GET() {
  const items = getGalleryItems();
  const supabase = getServiceSupabase({ requireServiceRole: true });

  let signups: Array<{ id: string; email: string; name: string; createdAt: string }> = [];
  if (supabase) {
    const { data } = await supabase.auth.admin.listUsers();
    signups = (data?.users || []).map((user) => ({
      id: user.id,
      email: user.email || '',
      name: typeof user.user_metadata?.name === 'string' ? user.user_metadata.name : (user.email || 'User').split('@')[0],
      createdAt: user.created_at || new Date(0).toISOString(),
    }));
  }

  return NextResponse.json({
    success: true,
    ...buildMarketplacePayload({ items, signups }),
  });
}
```

- [ ] **Step 8: Run the focused marketplace tests**

Run: `npm test -- src/lib/marketplace.test.ts src/app/api/marketplace/route.test.ts`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add src/lib/galleryStore.ts src/app/api/gallery/route.ts src/lib/marketplace.ts src/lib/marketplace.test.ts src/app/api/marketplace/route.ts src/app/api/marketplace/route.test.ts
git commit -m "feat: add public marketplace data route"
```

## Task 2: Add Owner Visibility Update Endpoint

**Files:**
- Create: `src/app/api/gallery/[id]/visibility/route.ts`
- Create: `src/app/api/gallery/[id]/visibility/route.test.ts`
- Modify: `src/lib/galleryStore.ts`

- [ ] **Step 1: Write the failing visibility endpoint test**

```ts
import { describe, expect, it, vi } from 'vitest';
import { POST } from './route';

const updateVisibility = vi.fn(() => ({
  id: 'gal_1',
  visibility: 'private',
}));

vi.mock('@/lib/galleryStore', () => ({
  updateGalleryItemVisibility,
}));

describe('POST /api/gallery/[id]/visibility', () => {
  it('updates an item to private', async () => {
    const req = new Request('http://localhost/api/gallery/gal_1/visibility', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ visibility: 'private' }),
    });

    const res = await POST(req, { params: Promise.resolve({ id: 'gal_1' }) });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json.item.visibility).toBe('private');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/api/gallery/[id]/visibility/route.test.ts`
Expected: FAIL with missing route or helper

- [ ] **Step 3: Write minimal visibility update helper and route**

```ts
// src/lib/galleryStore.ts
export const updateGalleryItemVisibility = (id: string, visibility: 'public' | 'private') => {
  const item = global.galleryStore.find((candidate) => candidate.id === id);
  if (!item) return null;
  item.visibility = visibility;
  return item;
};
```

```ts
// src/app/api/gallery/[id]/visibility/route.ts
import { NextResponse } from 'next/server';
import { updateGalleryItemVisibility } from '@/lib/galleryStore';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const visibility = body && body.visibility === 'private' ? 'private' : 'public';
  const item = updateGalleryItemVisibility(id, visibility);

  if (!item) {
    return NextResponse.json({ success: false, error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, item });
}
```

- [ ] **Step 4: Run visibility endpoint test to verify it passes**

Run: `npm test -- src/app/api/gallery/[id]/visibility/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add src/lib/galleryStore.ts src/app/api/gallery/[id]/visibility/route.ts src/app/api/gallery/[id]/visibility/route.test.ts
git commit -m "feat: add gallery visibility endpoint"
```

## Task 3: Add Visibility Control To Studio Save Flow

**Files:**
- Modify: `src/app/studio/page.tsx`
- Modify: `src/app/studio/page.test.tsx`

- [ ] **Step 1: Write the failing Studio visibility test**

```ts
it('sends visibility with the saved gallery item payload', async () => {
  const calls: Array<{ url: string; body: Record<string, unknown> | null }> = [];
  global.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
    const body = typeof init?.body === 'string' ? JSON.parse(init.body) : null;
    calls.push({ url, body });

    if (url.includes('/api/generate/image')) {
      return { ok: true, status: 200, json: async () => ({ success: true, image_url: 'https://example.com/generated.png' }) } as Response;
    }
    if (url.includes('/api/content-factory')) {
      return { ok: true, status: 200, json: async () => ({ success: true, items: [{ text_content: 'Generated post copy' }] }) } as Response;
    }
    if (url.includes('/api/gallery')) {
      return { ok: true, status: 200, json: async () => ({ success: true, item: { id: 'gallery_1' } }) } as Response;
    }
    return { ok: true, json: async () => ({ success: true }) } as Response;
  }) as typeof fetch;

  await renderStudioPage();
  fireEvent.change(screen.getByPlaceholderText('Describe the image and post content you want to generate...'), {
    target: { value: 'marketplace-ready quantum art' },
  });
  fireEvent.click(screen.getByLabelText('Private asset'));
  fireEvent.click(screen.getByRole('button', { name: 'Generate Standard Asset & Content' }));

  await waitFor(() => {
    const galleryCall = calls.find((call) => call.url.includes('/api/gallery'));
    expect(galleryCall?.body?.visibility).toBe('private');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/studio/page.test.tsx`
Expected: FAIL because the page has no visibility control and `/api/gallery` payload omits `visibility`

- [ ] **Step 3: Write minimal Studio visibility state and payload**

```tsx
// src/app/studio/page.tsx
const [assetVisibility, setAssetVisibility] = useState<'public' | 'private'>('public');
```

```tsx
<div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4">
  <div className="text-sm font-semibold text-white">Marketplace Visibility</div>
  <div className="mt-3 flex gap-3">
    <label className="flex items-center gap-2 text-sm text-zinc-300">
      <input
        type="radio"
        name="asset-visibility"
        aria-label="Public asset"
        checked={assetVisibility === 'public'}
        onChange={() => setAssetVisibility('public')}
      />
      Public asset
    </label>
    <label className="flex items-center gap-2 text-sm text-zinc-300">
      <input
        type="radio"
        name="asset-visibility"
        aria-label="Private asset"
        checked={assetVisibility === 'private'}
        onChange={() => setAssetVisibility('private')}
      />
      Private asset
    </label>
  </div>
</div>
```

```ts
// existing /api/gallery POST body inside Studio save block
body: JSON.stringify({
  imageUrl,
  prompt,
  userName,
  catalogName,
  userId,
  deviceId,
  isQuantumVerified: quantumMode,
  visibility: assetVisibility,
})
```

- [ ] **Step 4: Run the Studio test to verify it passes**

Run: `npm test -- src/app/studio/page.test.tsx`
Expected: PASS for the new visibility case

- [ ] **Step 5: Commit**

```bash
git add src/app/studio/page.tsx src/app/studio/page.test.tsx
git commit -m "feat: add studio asset visibility control"
```

## Task 4: Add Visibility Control To My Gallery

**Files:**
- Modify: `src/app/gallery/page.tsx`
- Modify: `src/app/gallery/page.test.tsx`

- [ ] **Step 1: Write the failing My Gallery visibility test**

```ts
it('updates visibility from My Gallery', async () => {
  const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

    if (url.includes('/api/gallery') && (!init || init.method === undefined)) {
      return {
        ok: true,
        json: async () => ({
          success: true,
          items: [
            {
              id: 'gal_1',
              imageUrl: 'https://example.com/generated.png',
              prompt: 'public art',
              userName: 'Jose',
              catalogName: "Jose's Catalog",
              userId: 'user-1',
              isFavorite: false,
              createdAt: '2026-08-13T12:00:00.000Z',
              visibility: 'public',
            },
          ],
        }),
      } as Response;
    }

    if (url.includes('/api/gallery/gal_1/visibility')) {
      return {
        ok: true,
        json: async () => ({
          success: true,
          item: { id: 'gal_1', visibility: 'private' },
        }),
      } as Response;
    }

    return { ok: true, json: async () => ({ success: true }) } as Response;
  });

  global.fetch = fetchMock as typeof fetch;
  render(<GalleryPage />);

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /make private/i })).toBeInTheDocument();
  });

  fireEvent.click(screen.getByRole('button', { name: /make private/i }));

  await waitFor(() => {
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('/api/gallery/gal_1/visibility'),
      expect.objectContaining({ method: 'POST' }),
    );
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/gallery/page.test.tsx`
Expected: FAIL because the current page has no visibility control

- [ ] **Step 3: Write minimal My Gallery control**

```tsx
// src/app/gallery/page.tsx
const updateVisibility = async (id: string, visibility: 'public' | 'private') => {
  setItems((current) =>
    current.map((item) => (item.id === id ? { ...item, visibility } : item)),
  );

  const res = await fetch(`/api/gallery/${id}/visibility`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ visibility }),
  });

  if (!res.ok) {
    fetchGallery();
  }
};
```

```tsx
<button
  type="button"
  aria-label={item.visibility === 'private' ? 'Make public' : 'Make private'}
  onClick={() => updateVisibility(item.id, item.visibility === 'private' ? 'public' : 'private')}
  className="rounded-lg border border-zinc-700 px-3 py-2 text-xs text-zinc-300 hover:text-white"
>
  {item.visibility === 'private' ? 'Make Public' : 'Make Private'}
</button>
```

- [ ] **Step 4: Run My Gallery tests to verify they pass**

Run: `npm test -- src/app/gallery/page.test.tsx`
Expected: PASS for the new visibility test and existing gallery behavior

- [ ] **Step 5: Commit**

```bash
git add src/app/gallery/page.tsx src/app/gallery/page.test.tsx
git commit -m "feat: add gallery visibility management"
```

## Task 5: Build Marketplace Page And Navigation

**Files:**
- Create: `src/components/marketplace/MarketplaceHero.tsx`
- Create: `src/components/marketplace/QuantumComparison.tsx`
- Create: `src/components/marketplace/MarketplaceAssetGrid.tsx`
- Create: `src/components/marketplace/CreatorStrip.tsx`
- Create: `src/app/marketplace/page.tsx`
- Create: `src/app/marketplace/page.test.tsx`
- Modify: `src/components/Header.tsx`

- [ ] **Step 1: Write the failing marketplace page test**

```ts
import '@testing-library/jest-dom/vitest';
import { render, screen, waitFor } from '@testing-library/react';
import MarketplacePage from './page';

describe('MarketplacePage', () => {
  it('renders the public storefront sections in order', async () => {
    global.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        success: true,
        items: [
          {
            id: 'public-1',
            imageUrl: 'https://example.com/public-1.png',
            prompt: 'marketplace prompt',
            userName: 'Jose',
            catalogName: "Jose's Catalog",
            userId: 'user-1',
            createdAt: '2026-08-13T12:00:00.000Z',
            visibility: 'public',
          },
        ],
        signupCards: [{ id: 'user-2', name: 'Nia', email: 'nia@example.com', createdAt: '2026-08-13T11:00:00.000Z' }],
        featuredCreators: [{ id: 'user-1', name: 'Jose', itemCount: 2, latestAssetCreatedAt: '2026-08-13T12:00:00.000Z' }],
        activeCreators: [{ id: 'user-1', name: 'Jose', itemCount: 2, latestAssetCreatedAt: '2026-08-13T12:00:00.000Z' }],
      }),
    })) as typeof fetch;

    render(<MarketplacePage />);

    await waitFor(() => {
      expect(screen.getByText('Marketplace')).toBeInTheDocument();
      expect(screen.getByText('Standard Generation')).toBeInTheDocument();
      expect(screen.getByText('Real Quantum Generation')).toBeInTheDocument();
      expect(screen.getByText('Latest Public Assets For Sale')).toBeInTheDocument();
      expect(screen.getByText('Featured Creators')).toBeInTheDocument();
      expect(screen.getByText('Latest Sign-Ups')).toBeInTheDocument();
      expect(screen.getByText('Latest Active Creators')).toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/app/marketplace/page.test.tsx`
Expected: FAIL with missing route/page

- [ ] **Step 3: Write the minimal Marketplace route and components**

```tsx
// src/app/marketplace/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Header } from '@/components/Header';
import { MarketplaceHero } from '@/components/marketplace/MarketplaceHero';
import { QuantumComparison } from '@/components/marketplace/QuantumComparison';
import { MarketplaceAssetGrid } from '@/components/marketplace/MarketplaceAssetGrid';
import { CreatorStrip } from '@/components/marketplace/CreatorStrip';

export default function MarketplacePage() {
  const [data, setData] = useState<{ items: unknown[]; signupCards: unknown[]; featuredCreators: unknown[]; activeCreators: unknown[] }>({
    items: [],
    signupCards: [],
    featuredCreators: [],
    activeCreators: [],
  });

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      const res = await fetch('/api/marketplace', { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (!cancelled && json?.success) {
        setData({
          items: Array.isArray(json.items) ? json.items : [],
          signupCards: Array.isArray(json.signupCards) ? json.signupCards : [],
          featuredCreators: Array.isArray(json.featuredCreators) ? json.featuredCreators : [],
          activeCreators: Array.isArray(json.activeCreators) ? json.activeCreators : [],
        });
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />
      <main className="mx-auto flex max-w-7xl flex-col gap-12 px-4 py-10">
        <MarketplaceHero />
        <QuantumComparison />
        <MarketplaceAssetGrid title="Latest Public Assets For Sale" items={data.items} />
        <CreatorStrip title="Featured Creators" items={data.featuredCreators} />
        <CreatorStrip title="Latest Sign-Ups" items={data.signupCards} />
        <CreatorStrip title="Latest Active Creators" items={data.activeCreators} />
      </main>
    </div>
  );
}
```

```tsx
// src/components/marketplace/QuantumComparison.tsx
import { ArrowRight } from 'lucide-react';

const standardSteps = ['Write Prompt', 'Render Standard Asset', 'Preview On Product', 'Purchase'];
const quantumSteps = ['Write Prompt', 'Unlock Quantum Session', 'Render Verified Asset', 'Preview Premium Result', 'Purchase'];

export function QuantumComparison() {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-zinc-800 bg-zinc-900/40 p-6">
        <h2 className="text-2xl font-semibold text-white">Standard Generation</h2>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-zinc-300">
          {standardSteps.map((step, index) => (
            <div key={step} className="flex items-center gap-2">
              <span>{step}</span>
              {index < standardSteps.length - 1 ? <ArrowRight className="h-4 w-4 text-zinc-500" /> : null}
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-3xl border border-indigo-500/30 bg-indigo-500/10 p-6">
        <h2 className="text-2xl font-semibold text-white">Real Quantum Generation</h2>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-indigo-100">
          {quantumSteps.map((step, index) => (
            <div key={step} className="flex items-center gap-2">
              <span>{step}</span>
              {index < quantumSteps.length - 1 ? <ArrowRight className="h-4 w-4 text-indigo-300" /> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

```ts
// src/components/Header.tsx add nav item
{ href: '/marketplace', label: 'Marketplace', visible: true },
```

- [ ] **Step 4: Run Marketplace and Header tests**

Run: `npm test -- src/app/marketplace/page.test.tsx src/app/gallery/page.test.tsx src/app/studio/page.test.tsx`
Expected: PASS for the new page and no regression in adjacent flows

- [ ] **Step 5: Run lint for touched Marketplace files**

Run: `npx eslint src/components/Header.tsx src/components/marketplace/*.tsx src/app/marketplace/page.tsx src/app/marketplace/page.test.tsx src/app/studio/page.tsx src/app/gallery/page.tsx`
Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add src/components/Header.tsx src/components/marketplace src/app/marketplace/page.tsx src/app/marketplace/page.test.tsx
git commit -m "feat: add marketplace public storefront"
```

## Final Verification

- [ ] **Step 1: Run the full focused test matrix**

Run:

```bash
npm test -- src/lib/marketplace.test.ts src/app/api/marketplace/route.test.ts src/app/api/gallery/[id]/visibility/route.test.ts src/app/studio/page.test.tsx src/app/gallery/page.test.tsx src/app/marketplace/page.test.tsx
```

Expected: all targeted tests pass

- [ ] **Step 2: Run lint on touched files**

Run:

```bash
npx eslint src/lib/galleryStore.ts src/app/api/gallery/route.ts src/app/api/gallery/[id]/visibility/route.ts src/lib/marketplace.ts src/app/api/marketplace/route.ts src/app/studio/page.tsx src/app/gallery/page.tsx src/components/Header.tsx src/components/marketplace/*.tsx src/app/marketplace/page.tsx
```

Expected: no new errors

- [ ] **Step 3: Manual spot check**

Run:

```bash
npm run dev
```

Check:

- `/marketplace` shows the public asset grid, hero, comparison, sign-ups, and creator sections
- `/gallery` still shows owner-facing controls and visibility toggles
- `Studio` defaults new assets to public and allows switching to private before save
- Private items do not appear in `Marketplace`

- [ ] **Step 4: Final commit if verification changes were needed**

```bash
git add -A
git commit -m "test: verify marketplace public storefront flow"
```
