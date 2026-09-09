'use client';

import { useCallback, useEffect, useState } from 'react';

import { Header } from '@/components/Header';
import { CreatorStrip } from '@/components/marketplace/CreatorStrip';
import { MarketplaceAssetGrid } from '@/components/marketplace/MarketplaceAssetGrid';
import { MarketplaceHero } from '@/components/marketplace/MarketplaceHero';
import { QuantumComparison } from '@/components/marketplace/QuantumComparison';

type MarketplaceItem = {
  id: string;
  imageUrl: string;
  prompt: string;
  userName: string;
  catalogName: string;
  visibility?: 'public' | 'private';
};

type MarketplaceData = {
  items: MarketplaceItem[];
  signupCards: Array<{ id: string; name: string; createdAt: string }>;
  featuredCreators: Array<{ id: string; name: string; itemCount: number; latestAssetCreatedAt: string }>;
  activeCreators: Array<{ id: string; name: string; itemCount: number; latestAssetCreatedAt: string }>;
};

const EMPTY_DATA: MarketplaceData = {
  items: [],
  signupCards: [],
  featuredCreators: [],
  activeCreators: [],
};

export default function MarketplacePage() {
  const [data, setData] = useState<MarketplaceData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<MarketplaceItem | null>(null);

  const loadMarketplace = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/marketplace', { cache: 'no-store' });
      const json = await res.json().catch(() => null);
      if (!res.ok || !json?.success) {
        throw new Error('marketplace_failed');
      }

      setData({
        items: Array.isArray(json.items) ? json.items : [],
        signupCards: Array.isArray(json.signupCards) ? json.signupCards : [],
        featuredCreators: Array.isArray(json.featuredCreators) ? json.featuredCreators : [],
        activeCreators: Array.isArray(json.activeCreators) ? json.activeCreators : [],
      });
    } catch {
      setError('Marketplace unavailable right now.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMarketplace();
  }, [loadMarketplace]);

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <Header />
      <main className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-10">
        <MarketplaceHero />
        <QuantumComparison />
        {error ? (
          <section className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6">
            <div className="text-lg font-semibold text-white">{error}</div>
            <button
              type="button"
              onClick={loadMarketplace}
              className="mt-4 inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/15 bg-black/30 px-4 py-2 text-sm font-semibold text-white hover:bg-black/50"
            >
              Retry
            </button>
          </section>
        ) : (
          <>
            <MarketplaceAssetGrid
              title="Latest Public Assets For Sale"
              items={loading ? [] : data.items}
              previewItem={previewItem}
              onPreview={setPreviewItem}
              onClosePreview={() => setPreviewItem(null)}
            />
            <CreatorStrip title="Featured Creators" items={data.featuredCreators} />
            <CreatorStrip title="Latest Sign-Ups" items={data.signupCards} />
            <CreatorStrip title="Latest Active Creators" items={data.activeCreators} />
          </>
        )}
      </main>
    </div>
  );
}
