import { Header } from '@/components/Header';
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

const trustPillars = ['Original Designs', 'Premium Product Presentation', 'Secure Checkout', 'Designed To Feel Personal'];

const processSteps = [
  {
    title: 'Begin With A Prompt',
    body: 'Describe a mood, memory, image, or concept. Start with something personal, cinematic, emotional, or abstract.',
  },
  {
    title: 'Shape The Visual',
    body: 'Your direction becomes a premium fractal composition with more collectible, gallery-like energy than ordinary AI merch.',
  },
  {
    title: 'Preview And Order',
    body: 'Review the finished piece on product, refine the final presentation, and move through a cleaner order flow.',
  },
];

const premiumReasons = [
  {
    title: 'Original Visual Identity',
    body: 'Each piece is guided by your direction instead of being pulled from a generic template library.',
  },
  {
    title: 'Luxury Presentation',
    body: 'The product story, layout, and surfaces are meant to feel curated rather than transactional.',
  },
  {
    title: 'Cleaner Custom Flow',
    body: 'From creation to preview to order, the experience stays focused and easier to trust.',
  },
  {
    title: 'One-of-One Energy',
    body: 'The final piece is designed to feel singular, memorable, and difficult to replace.',
  },
];

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
  const fallbackImageUrl = heroImageUrl ?? '/placeholder-future-city.svg';
  const selectedPieces = [
    {
      title: 'Midnight Bloom',
      strap: 'Editorial Release',
      body: 'A deep-spectrum composition with soft contrast, premium darkness, and a gallery-piece presence.',
      imageUrl: resolvePostMediaUrl(initialPosts[0]) ?? fallbackImageUrl,
    },
    {
      title: 'Solar Veil',
      strap: 'Curated Drop',
      body: 'Layered geometry and luminous detail designed to feel rare, polished, and unmistakably personal.',
      imageUrl: resolvePostMediaUrl(initialPosts[1]) ?? fallbackImageUrl,
    },
    {
      title: 'Echo Vessel',
      strap: 'Signature Piece',
      body: 'A darker, more sculptural visual direction that turns generated art into a premium wearable statement.',
      imageUrl: resolvePostMediaUrl(initialPosts[2]) ?? fallbackImageUrl,
    },
  ];

  return (
    <div className="min-h-screen bg-black text-white selection:bg-primary/30">
      <Header />
      <main className="pb-20">
        <section className="relative overflow-hidden border-b border-white/10 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.14),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.08),transparent_18%),linear-gradient(180deg,#0a0a0a_0%,#050505_100%)]">
          <div className="container mx-auto px-4 py-12 md:py-20">
            <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
              <div className="max-w-2xl">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-200/80">Luxury Fractal Apparel</p>
                <h1 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl lg:text-7xl">
                  Wear A Design No One Else Has
                </h1>
                <p className="mt-6 max-w-xl text-base leading-7 text-zinc-300 sm:text-lg">
                  ForeverTech transforms your idea into premium fractal apparel with a luxury presentation,
                  collectible feel, and a creation process designed to feel personal from start to finish.
                </p>
                <div className="mt-8 flex flex-wrap items-center gap-4">
                  <Link
                    href="/studio"
                    className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
                  >
                    Create Your Piece
                  </Link>
                  <Link
                    href="/gallery"
                    className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
                  >
                    Explore The Collection
                  </Link>
                </div>
                <p className="mt-5 text-sm text-zinc-500">
                  Original visual identity. Premium presentation. A piece that feels like yours.
                </p>

                <div className="mt-10 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  {trustPillars.map((pillar) => (
                    <div
                      key={pillar}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-center text-xs font-medium uppercase tracking-[0.22em] text-zinc-200"
                    >
                      {pillar}
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-3 rounded-[2rem] bg-amber-200/10 blur-2xl" />
                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950 shadow-[0_40px_120px_rgba(0,0,0,0.55)]">
                  <div className="relative aspect-[4/5] w-full overflow-hidden">
                    <Image
                      src={fallbackImageUrl}
                      alt="Luxury featured fractal apparel design"
                      fill
                      priority
                      sizes="(min-width: 1024px) 42vw, 100vw"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.15)_0%,rgba(0,0,0,0.28)_40%,rgba(0,0,0,0.84)_100%)]" />
                    <div className="absolute left-6 top-6 rounded-full border border-white/15 bg-black/35 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-zinc-100 backdrop-blur">
                      Selected Piece
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-6">
                      <div className="rounded-[1.6rem] border border-white/10 bg-black/45 p-5 backdrop-blur-md">
                        <p className="text-xs uppercase tracking-[0.3em] text-zinc-400">Midnight Bloom</p>
                        <p className="mt-3 text-2xl font-semibold text-white">Luxury custom tees, reimagined as collectible pieces.</p>
                        <p className="mt-3 text-sm leading-6 text-zinc-300">
                          Start with your idea and move through a more composed path from concept to finished product.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <div className="mx-auto max-w-4xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-200/80">Signature Value</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">
              Not mass-made. Not template-made.
            </h2>
            <p className="mt-6 text-base leading-8 text-zinc-300 sm:text-lg">
              Every piece begins with your prompt, develops into an original visual direction, and becomes a finished
              product designed to feel rare, elevated, and deeply personal. ForeverTech is built for customers who
              want more than another printed tee. It is for people who want something with presence.
            </p>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-20">
          <div className="mb-10 flex flex-col gap-3 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-200/80">From Idea To Finished Piece</p>
            <h2 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">A simpler, more refined path to wearable art.</h2>
          </div>
          <div className="grid gap-5 lg:grid-cols-3">
            {processSteps.map((step, index) => (
              <div key={step.title} className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-8 shadow-[0_20px_80px_rgba(0,0,0,0.3)]">
                <div className="text-sm font-semibold uppercase tracking-[0.28em] text-zinc-500">Step {index + 1}</div>
                <h3 className="mt-4 text-2xl font-semibold text-white">{step.title}</h3>
                <p className="mt-4 text-sm leading-7 text-zinc-400">{step.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-white/10 bg-zinc-950/60 py-20">
          <div className="container mx-auto px-4">
            <div className="mb-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-200/80">Collection Preview</p>
                <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Selected Pieces</h2>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
                  A curated collection of recent designs presented as finished works, not just outputs.
                </p>
              </div>
              <Link href="/gallery" className="text-sm font-semibold text-zinc-200 transition-colors hover:text-white">
                View Full Collection
              </Link>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              {selectedPieces.map((piece) => (
                <article key={piece.title} className="overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-[0_24px_90px_rgba(0,0,0,0.4)]">
                  <div className="relative aspect-[4/5] w-full overflow-hidden">
                    <Image
                      src={piece.imageUrl}
                      alt={piece.title}
                      fill
                      sizes="(min-width: 1024px) 30vw, 100vw"
                      className="object-cover transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08)_0%,rgba(0,0,0,0.22)_45%,rgba(0,0,0,0.82)_100%)]" />
                    <div className="absolute left-5 top-5 rounded-full border border-white/15 bg-black/45 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.24em] text-zinc-100">
                      {piece.strap}
                    </div>
                    <div className="absolute inset-x-0 bottom-0 p-5">
                      <p className="text-sm uppercase tracking-[0.28em] text-zinc-400">{piece.title}</p>
                      <p className="mt-3 text-sm leading-6 text-zinc-200">{piece.body}</p>
                      <Link
                        href="/gallery"
                        className="mt-5 inline-flex rounded-full border border-white/15 bg-white/6 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/12"
                      >
                        Explore Piece
                      </Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-20">
          <div className="mb-10 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-200/80">Why This Feels Different</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
              Most custom merch feels transactional. This is designed to feel composed.
            </h2>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {premiumReasons.map((reason) => (
              <div key={reason.title} className="rounded-[1.8rem] border border-white/10 bg-zinc-950/70 p-6">
                <h3 className="text-xl font-semibold text-white">{reason.title}</h3>
                <p className="mt-4 text-sm leading-7 text-zinc-400">{reason.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="container mx-auto px-4 pb-20">
          <div className="grid gap-6 rounded-[2.5rem] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.01)_100%)] p-8 md:grid-cols-[1.1fr_0.9fr] md:p-12">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-200/80">Designed To Feel Like Yours</h2>
              <h3 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-4xl">The story matters as much as the image.</h3>
              <p className="mt-6 text-sm leading-8 text-zinc-300 sm:text-base">
                For customers who care about originality, a ForeverTech piece is more than a surface design. It
                carries the feeling of authorship, selection, and intention. The finished product should feel like it
                belongs to your vision, not to a generic catalog.
              </p>
              <p className="mt-6 text-sm font-medium text-zinc-400">
                Originality is not just what you see. It is what the piece feels like it belongs to.
              </p>
            </div>
            <div className="grid gap-4 rounded-[2rem] border border-white/10 bg-black/30 p-6">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5">
                <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">For Customers Who Want More</p>
                <p className="mt-3 text-lg font-semibold text-white">Stronger design identity and cleaner presentation.</p>
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] p-5 text-sm leading-7 text-zinc-300">
                Premium gallery-inspired presentation. Cleaner path from prompt to purchase. Made to feel personal and collectible.
              </div>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 pb-20">
          <div className="rounded-[2.5rem] border border-amber-200/20 bg-[radial-gradient(circle_at_top,rgba(212,175,55,0.18),transparent_26%),linear-gradient(180deg,rgba(255,255,255,0.05)_0%,rgba(255,255,255,0.01)_100%)] px-6 py-12 text-center md:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-amber-100/80">Final Call To Action</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white sm:text-5xl">Create Something Worth Wearing</h2>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-zinc-200">
              Start with your idea and turn it into a piece that feels personal, premium, and hard to replace.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/studio"
                className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-black transition-colors hover:bg-zinc-200"
              >
                Start Creating
              </Link>
              <Link
                href="/gallery"
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
              >
                Browse Recent Pieces
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
