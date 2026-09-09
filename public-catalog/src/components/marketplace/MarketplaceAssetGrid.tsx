import Image from 'next/image';
import Link from 'next/link';

type MarketplaceItem = {
  id: string;
  imageUrl: string;
  prompt: string;
  userName: string;
  catalogName: string;
  visibility?: 'public' | 'private';
};

export function MarketplaceAssetGrid({
  title,
  items,
  previewItem,
  onPreview,
  onClosePreview,
}: {
  title: string;
  items: MarketplaceItem[];
  previewItem: MarketplaceItem | null;
  onPreview: (item: MarketplaceItem) => void;
  onClosePreview: () => void;
}) {
  return (
    <section id="marketplace-assets" className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">{items.length} public</div>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-6 text-sm text-zinc-400">
          No Public Assets Yet
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="overflow-hidden rounded-[28px] border border-zinc-800 bg-zinc-900/60">
              <div className="relative aspect-[4/3] bg-zinc-950">
                <Image
                  src={item.imageUrl}
                  alt={item.prompt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover"
                  unoptimized
                />
              </div>
              <div className="space-y-4 p-5">
                <div>
                  <div className="text-sm font-semibold text-white">{item.userName}</div>
                  <div className="mt-1 text-sm text-zinc-400">{item.catalogName}</div>
                  <p className="mt-3 text-sm text-zinc-300">{item.prompt}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onPreview(item)}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
                  >
                    Preview
                  </button>
                  <Link
                    href={`/customize?imageUrl=${encodeURIComponent(item.imageUrl)}&prompt=${encodeURIComponent(item.prompt)}`}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-xl border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 hover:bg-zinc-800"
                  >
                    Customize
                  </Link>
                  <button
                    type="button"
                    className="inline-flex min-h-[40px] items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-black hover:bg-zinc-200"
                  >
                    Purchase
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
      {previewItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-4xl rounded-[28px] border border-zinc-800 bg-zinc-950 p-5 shadow-[0_30px_100px_rgba(0,0,0,0.6)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Public Preview</div>
                <div className="mt-1 text-lg font-semibold text-white">{previewItem.userName}</div>
              </div>
              <button
                type="button"
                onClick={onClosePreview}
                className="rounded-xl border border-zinc-700 px-4 py-2 text-sm text-zinc-200 hover:bg-zinc-900"
              >
                Close
              </button>
            </div>
            <div className="relative mt-4 aspect-[16/10] overflow-hidden rounded-2xl bg-zinc-900">
              <Image
                src={previewItem.imageUrl}
                alt={previewItem.prompt}
                fill
                sizes="100vw"
                className="object-contain"
                unoptimized
              />
            </div>
            <p className="mt-4 text-sm text-zinc-300">{previewItem.prompt}</p>
          </div>
        </div>
      ) : null}
    </section>
  );
}
