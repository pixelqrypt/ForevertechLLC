import { Header } from '@/components/Header';
import { CatalogGrid } from '@/components/CatalogGrid';
import Link from 'next/link';
import Image from 'next/image';
import fs from 'fs';
import path from 'path';

type CatalogPost = {
  id: string;
  content: string;
  ipfsHash?: string;
  timestamp: string;
  metadata?: { title?: string; mediaUrl?: string; prompt?: string; [key: string]: unknown };
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

async function getInitialPosts(): Promise<CatalogPost[]> {
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

      const ipfsHash = index < 3 ? `QmSeeded${String(index + 1).padStart(2, '0')}` : undefined;

      return {
        id: file,
        content: `Quantum Generated Asset - ${parts.length > 2 ? parts[2].replace('.png', '') : 'Image'}`,
        timestamp: date.toISOString(),
        ipfsHash,
        metadata: {
          title: `Quantum Asset ${file.substring(0, 8)}`,
          mediaUrl: `/api/images/${encodeURIComponent(file)}`,
          priceUsd: 59.99,
          prompt: 'seeded',
        },
      } satisfies CatalogPost;
    });

    if (posts.length === 0 && process.env.NODE_ENV !== 'production') {
      return [
        {
          id: 'seed-post-1',
          content: 'Seeded Quantum Generated Asset',
          timestamp: new Date().toISOString(),
          ipfsHash: 'QmSeeded01',
          metadata: {
            title: 'Quantum Asset Seed',
            mediaUrl: '/placeholder-future-city.svg',
            priceUsd: 59.99,
            prompt: 'seeded',
          },
        },
      ];
    }

    return posts;
  } catch {
    return [];
  }
}

export default async function Home() {
  const initialPosts = await getInitialPosts();
  const heroPost = initialPosts[0];
  const heroImageUrl = resolvePostMediaUrl(heroPost);

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30">
      <Header />
      <main className="space-y-12 pb-12">
        {/* Hero Section */}
        <section className="container mx-auto px-4 pt-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Main Hero - Latest Drop */}
            <div className="relative col-span-1 md:col-span-2 aspect-video w-full overflow-hidden rounded-2xl border border-zinc-800 shadow-2xl shadow-primary/10 group">
              {heroImageUrl ? (
                <Image
                  src={heroImageUrl}
                  alt="Latest published design"
                  fill
                  sizes="(min-width: 768px) 66vw, 100vw"
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  priority
                />
              ) : (
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.20),transparent_55%),radial-gradient(ellipse_at_bottom,rgba(16,185,129,0.12),transparent_55%)]" />
              )}
              <div className="absolute top-4 left-4 z-10">
                <span className="inline-flex items-center rounded-full bg-black/60 px-3 py-1 text-xs font-medium text-white backdrop-blur-md border border-white/10">
                  Latest Build
                </span>
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex items-end p-8">
                <div className="max-w-xl">
                  <h1 className="text-3xl md:text-5xl font-bold text-white tracking-tight drop-shadow-lg mb-2">
                    Create Your One-of-One <span className="text-primary">Fractal</span> Tee
                  </h1>
                  <p className="text-zinc-300 text-sm md:text-base line-clamp-3">
                    Turn a prompt into an original design, preview it on merch, customize the final product, and order a piece that feels made just for you.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <Link
                      href="/studio"
                      className="inline-flex items-center justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200 transition-colors"
                    >
                      Start Creating
                    </Link>
                    <Link
                      href="/gallery"
                      className="inline-flex items-center justify-center rounded-lg bg-black/40 px-4 py-2 text-sm font-semibold text-white hover:bg-black/55 border border-white/10 backdrop-blur-md transition-colors"
                    >
                      Browse Gallery
                    </Link>
                  </div>
                </div>
              </div>
            </div>

            {/* Side Hero - Quick Summary */}
            <div className="col-span-1 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
              <div className="flex h-full flex-col justify-between gap-6 p-6">
                <div className="space-y-3">
                  <span className="inline-flex items-center rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                    Clean Build Flow
                  </span>
                  <h2 className="text-2xl font-semibold tracking-tight text-white">One path from prompt to product.</h2>
                  <p className="text-sm leading-6 text-zinc-400">
                    Generate an original visual, refine it on merch, and move into checkout without bouncing between
                    disconnected tools or duplicate steps.
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    'Generate a design from your prompt',
                    'Preview the artwork on the product before ordering',
                    'Finish with a simpler cart and checkout flow',
                  ].map((item) => (
                    <div
                      key={item}
                      className="rounded-xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-zinc-200"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <CatalogGrid initialPosts={initialPosts} />

        <section className="container mx-auto border-t border-zinc-800 px-4 pt-12">
          <div className="mx-auto max-w-5xl">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-white">Create In Three Steps</h2>
              <p className="mt-2 text-zinc-400">
                The storefront stays focused on the essentials so customers always know what to do next.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {[
                {
                  title: '1. Start With A Prompt',
                  description: 'Describe the mood, colors, or idea you want and open the generator in a single click.',
                },
                {
                  title: '2. Review The Preview',
                  description: 'Check the finished art on the product before committing to customization or purchase.',
                },
                {
                  title: '3. Customize And Order',
                  description: 'Adjust the final product, add it to cart, and move through checkout with less friction.',
                },
              ].map((step) => (
                <div
                  key={step.title}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6 shadow-lg shadow-black/20"
                >
                  <h3 className="text-lg font-semibold text-white">{step.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
