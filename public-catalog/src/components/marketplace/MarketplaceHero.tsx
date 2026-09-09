import Link from 'next/link';

export function MarketplaceHero() {
  return (
    <section className="rounded-[32px] border border-zinc-800 bg-[radial-gradient(circle_at_top_left,_rgba(168,85,247,0.18),_transparent_40%),linear-gradient(180deg,_rgba(24,24,27,0.96),_rgba(9,9,11,0.98))] p-8 shadow-[0_30px_120px_rgba(0,0,0,0.45)]">
      <div className="max-w-3xl">
        <div className="text-xs font-semibold uppercase tracking-[0.28em] text-zinc-500">Public Storefront</div>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white md:text-5xl">Marketplace</h1>
        <p className="mt-4 text-base leading-7 text-zinc-300 md:text-lg">
          Explore public PixelQrypt creations available for sale, compare standard versus real quantum generation,
          and discover creators publishing their newest premium work.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href="#marketplace-assets"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-white px-5 py-3 text-sm font-semibold text-black hover:bg-zinc-200"
          >
            Browse Public Assets
          </a>
          <Link
            href="/studio"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-white/15 bg-black/30 px-5 py-3 text-sm font-semibold text-white hover:bg-black/50"
          >
            Start In Studio
          </Link>
        </div>
      </div>
    </section>
  );
}
