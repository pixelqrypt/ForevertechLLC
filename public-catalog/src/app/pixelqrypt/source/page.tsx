import { Suspense } from 'react';

import { Header } from '@/components/Header';

import { PixelQryptSourceClient } from './PixelQryptSourceClient';

export default function PixelQryptSourcePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white"><Header /><main className="container mx-auto px-4 py-10">Loading…</main></div>}>
      <PixelQryptSourceClient />
    </Suspense>
  );
}
