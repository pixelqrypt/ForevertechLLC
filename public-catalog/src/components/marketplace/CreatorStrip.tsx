type CreatorStripItem = {
  id: string;
  name: string;
  createdAt?: string;
  itemCount?: number;
  latestAssetCreatedAt?: string;
};

export function CreatorStrip({
  title,
  items,
}: {
  title: string;
  items: CreatorStripItem[];
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        <div className="text-xs uppercase tracking-[0.24em] text-zinc-500">{items.length} live</div>
      </div>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-zinc-800 bg-zinc-900/30 p-5 text-sm text-zinc-400">
          More creators will appear here as public work goes live.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5">
              <div className="text-sm font-semibold text-white">{item.name}</div>
              {typeof item.itemCount === 'number' ? (
                <div className="mt-2 text-sm text-zinc-300">{item.itemCount} public assets</div>
              ) : null}
              <div className="mt-2 text-xs text-zinc-500">
                {item.latestAssetCreatedAt || item.createdAt || 'Recently active'}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
