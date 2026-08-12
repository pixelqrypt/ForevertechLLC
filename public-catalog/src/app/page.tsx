import { Header } from '@/components/Header';
import Link from 'next/link';
import fs from 'fs';
import path from 'path';
import { getGalleryItems } from '@/lib/galleryStore';
import Image from 'next/image';

type CatalogPost = {
  id: string;
  content: string;
  ipfsHash?: string;
  timestamp: string;
  metadata?: { title?: string; mediaUrl?: string; prompt?: string; priceUsd?: number; [key: string]: unknown };
};

type HomeCard = {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  href: string;
  badge: string;
};

function resolvePostMediaUrl(post: CatalogPost | undefined): string | null {
  if (!post) return null;
  const raw =
    (post.metadata && typeof post.metadata.mediaUrl === 'string' ? post.metadata.mediaUrl : null) || null;
  if (!raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://')) return raw;
  if (raw.startsWith('Qm') || raw.startsWith('bafy')) return `https://ipfs.io/ipfs/${raw}`;
  return `${raw.startsWith('/') ? '' : '/'}${raw}`;
}

async function getAdminPosts(): Promise<CatalogPost[]> {
  try {
    const imagesDir = path.join(process.cwd(), '..', 'quantum-image-gen', 'images');
    const files = fs.existsSync(imagesDir) ? fs.readdirSync(imagesDir) : [];
    const imageFiles = files.filter((f) => f.endsWith('.png')).sort((a, b) => b.localeCompare(a));

    const posts = imageFiles.map((file, index) => {
      const parts = file.split('_');
      const timestampStr = parts[0];

      let date = new Date();
      if (timestampStr && timestampStr.length >= 15) {
        const y = timestampStr.substring(0, 4);
        const m = timestampStr.substring(4, 6);
        const d = timestampStr.substring(6, 8);
        const h = timestampStr.substring(9, 11);
        const min = timestampStr.substring(11, 13);
        const s = timestampStr.substring(13, 15);
        date = new Date(`${y}-${m}-${d}T${h}:${min}:${s}Z`);
      }

      return {
        id: file,
        content: `Quantum Generated Asset - ${parts.length > 2 ? parts[2].replace('.png', '') : 'Image'}`,
        timestamp: date.toISOString(),
        ipfsHash: index < 3 ? `QmSeeded${String(index + 1).padStart(2, '0')}` : undefined,
        metadata: {
          title: `Quantum Asset ${file.substring(0, 8)}`,
          mediaUrl: `/api/images/${encodeURIComponent(file)}`,
          priceUsd: 59.99,
          prompt: 'seeded',
        },
      } satisfies CatalogPost;
    });

    if (posts.length > 0) return posts;
  } catch {
  }

  return [
    {
      id: 'admin-fallback-1',
      content: 'Quantum Spiral Bloom',
      timestamp: new Date().toISOString(),
      metadata: {
        title: 'Quantum Spiral Bloom Tee',
        mediaUrl: '/images/ai-gen-1.png',
        priceUsd: 59.99,
        prompt: 'quantum spiral bloom',
      },
    },
    {
      id: 'admin-fallback-2',
      content: 'Latest Build Spectrum',
      timestamp: new Date().toISOString(),
      metadata: {
        title: 'Spectrum Bloom Tee',
        mediaUrl: '/images/ai-gen-2.png',
        priceUsd: 59.99,
        prompt: 'latest build spectrum',
      },
    },
    {
      id: 'admin-fallback-3',
      content: 'Studio Drop Aurora',
      timestamp: new Date().toISOString(),
      metadata: {
        title: 'Aurora Fractal Tee',
        mediaUrl: '/images/ai-gen-3.png',
        priceUsd: 59.99,
        prompt: 'studio drop aurora',
      },
    },
  ];
}

function getUserProductCards(): HomeCard[] {
  const fallback: HomeCard[] = [
    {
      id: 'user-fallback-1',
      title: 'Public Gallery Tee',
      subtitle: 'Shared by the community',
      imageUrl: '/images/ai-gen-4.png',
      href: '/gallery',
      badge: 'Public Gallery',
    },
    {
      id: 'user-fallback-2',
      title: 'Creator Streetwear Drop',
      subtitle: 'Published user design',
      imageUrl: '/images/ai-gen-5.png',
      href: '/gallery',
      badge: 'Public Gallery',
    },
  ];

  try {
    const items = getGalleryItems();
    const usable = items
      .filter((item) => typeof item.imageUrl === 'string' && item.imageUrl.trim() && !item.imageUrl.includes('picsum.photos'))
      .slice(0, 4)
      .map((item) => ({
        id: item.id,
        title: item.catalogName || 'Public Gallery Product',
        subtitle: item.userName ? `By ${item.userName}` : 'Shared by the community',
        imageUrl: item.imageUrl,
        href: '/gallery',
        badge: 'Public Gallery',
      }));

    return usable.length ? usable : fallback;
  } catch {
    return fallback;
  }
}

function ProductBox({
  title,
  description,
  items,
  ctaLabel,
  ctaHref,
}: {
  title: string;
  description: string;
  items: HomeCard[];
  ctaLabel: string;
  ctaHref: string;
}) {
  return (
    <section className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">{title}</h2>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">{description}</p>
        </div>
        <Link
          href={ctaHref}
          className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/10 bg-white px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
        >
          {ctaLabel}
        </Link>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="group overflow-hidden rounded-2xl border border-zinc-800 bg-black/40 transition-transform hover:-translate-y-1"
          >
            <div className="relative aspect-square overflow-hidden bg-zinc-900">
              <Image
                src={item.imageUrl}
                alt={item.title}
                fill
                sizes="(min-width: 1280px) 18rem, (min-width: 640px) 45vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/65 px-3 py-1 text-[11px] font-medium text-white">
                {item.badge}
              </div>
            </div>
            <div className="space-y-2 p-4">
              <div className="text-base font-semibold text-white">{item.title}</div>
              <div className="text-sm text-zinc-400">{item.subtitle}</div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default async function Home() {
  const adminPosts = await getAdminPosts();
  const heroImageUrl = resolvePostMediaUrl(adminPosts[0]) || '/images/ai-gen-1.png';
  const adminCards: HomeCard[] = adminPosts.slice(0, 4).map((post, index) => ({
    id: post.id,
    title: post.metadata?.title || `Admin Build ${index + 1}`,
    subtitle: index === 0 ? 'Latest Build' : 'Built-in admin product',
    imageUrl: resolvePostMediaUrl(post) || `/images/ai-gen-${((index % 5) + 1).toString()}.png`,
    href: '/studio',
    badge: index === 0 ? 'Latest Build' : 'Admin Product',
  }));
  const userCards = getUserProductCards();

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30">
      <Header />
      <main className="container mx-auto space-y-10 px-4 py-8">
        <section className="overflow-hidden rounded-[2rem] border border-zinc-800 bg-zinc-950">
          <div className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="flex flex-col justify-center p-7 sm:p-10">
              <div className="mb-4 inline-flex w-fit items-center rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-zinc-200">
                Latest Build
              </div>
              <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.05em] text-white md:text-6xl">
                Discover admin drops, community designs, and quantum builds.
              </h1>
              <p className="mt-5 max-w-2xl text-base text-zinc-300">
                New visitors can quickly see what ForeverTech offers: built-in admin products, user generated products from the public gallery, and a clear comparison between Real Quantum Generation and Standard Generation.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  href="/studio"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
                >
                  Start Creating
                </Link>
                <Link
                  href="/gallery"
                  className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                >
                  Browse Community Work
                </Link>
              </div>
            </div>
            <div className="relative min-h-[320px] overflow-hidden border-t border-zinc-800 lg:min-h-full lg:border-l lg:border-t-0">
              <Image
                src={heroImageUrl}
                alt="Homepage featured build"
                fill
                priority
                sizes="(min-width: 1024px) 42vw, 100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/10" />
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <div className="text-sm font-semibold text-white">Quick storefront preview</div>
                <div className="mt-2 text-sm text-zinc-300">Shorter than the old long-scrolling home page, easier to explain at first glance.</div>
              </div>
            </div>
          </div>
        </section>

        <ProductBox
          title="Admin Products"
          description="Latest built-in products from the admin side of the site, using generated preview images so shoppers can immediately understand the catalog."
          items={adminCards}
          ctaLabel="Open Studio"
          ctaHref="/studio"
        />

        <ProductBox
          title="User Generated Products"
          description="Fresh previews from the Public Gallery so new visitors can see how community-made designs look as real storefront products."
          items={userCards}
          ctaLabel="Open Gallery"
          ctaHref="/gallery"
        />

        <section className="rounded-3xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-2xl font-semibold tracking-[-0.03em] text-white">Real Quantum Generation vs Standard Generation</h2>
              <p className="mt-2 max-w-3xl text-sm text-zinc-400">
                This side-by-side sample helps new users understand the difference between the recorded quantum-backed path and the regular fast generation path before they create or buy.
              </p>
            </div>
            <Link
              href="/about"
              className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            >
              Learn The Difference
            </Link>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            <div className="overflow-hidden rounded-2xl border border-violet-500/30 bg-black/50">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src="/images/quantum-generation-sample.svg"
                  alt="Real Quantum Generation sample"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute left-3 top-3 rounded-full border border-violet-300/20 bg-violet-500/20 px-3 py-1 text-[11px] font-medium text-white">
                  Real Quantum Generation
                </div>
              </div>
              <div className="space-y-2 p-4">
                <div className="text-base font-semibold text-white">Recorded quantum-backed sample</div>
                <div className="text-sm text-zinc-400">Built to represent the verified, provenance-focused path for premium story-driven creations.</div>
              </div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-black/50">
              <div className="relative aspect-[4/3] overflow-hidden">
                <Image
                  src="/images/standard-generation-sample.svg"
                  alt="Standard Generation sample"
                  fill
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover"
                />
                <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-black/65 px-3 py-1 text-[11px] font-medium text-white">
                  Standard Generation
                </div>
              </div>
              <div className="space-y-2 p-4">
                <div className="text-base font-semibold text-white">Fast standard sample</div>
                <div className="text-sm text-zinc-400">Shows the normal streamlined generation path for quick preview, customization, and shopping.</div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
