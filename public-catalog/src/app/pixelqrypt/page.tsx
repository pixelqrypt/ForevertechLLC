import { Suspense } from 'react';

import { Header } from '@/components/Header';

import { PixelQryptClient } from './PixelQryptClient';

export default function PixelQryptPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white"><Header /><main className="container mx-auto px-4 py-10">Loading…</main></div>}>
      <PixelQryptClient />
    </Suspense>
  );
}
