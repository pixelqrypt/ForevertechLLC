import { getGalleryItems, type GalleryItem } from './galleryStore';
import { getServiceSupabase } from './supabase';

export type HomepageComparisonSample = {
  imageUrl: string;
  title: string;
  description: string;
  isFallback: boolean;
};

type GalleryLikeRecord = {
  id: string;
  imageUrl: string;
  createdAt: string;
  isQuantumVerified?: boolean;
};

function isUsableHomepageImage(url: string) {
  const value = String(url || '').trim();
  if (!value) return false;
  if (value.startsWith('/')) return true;
  try {
    const parsed = new URL(value);
    return parsed.hostname !== 'picsum.photos';
  } catch {
    return false;
  }
}

export function pickHomepageComparisonSamples(
  records: GalleryLikeRecord[],
  fallback: {
    quantum: Omit<HomepageComparisonSample, 'isFallback'>;
    standard: Omit<HomepageComparisonSample, 'isFallback'>;
  },
) {
  const usable = records
    .filter((record) => isUsableHomepageImage(record.imageUrl))
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const quantum = usable.find((record) => record.isQuantumVerified);
  const standard = usable.find((record) => !record.isQuantumVerified);

  return {
    quantum: quantum
      ? {
          imageUrl: quantum.imageUrl,
          title: 'Real Quantum Generation',
          description: 'Latest studio-generated quantum sample',
          isFallback: false,
        }
      : {
          ...fallback.quantum,
          isFallback: true,
        },
    standard: standard
      ? {
          imageUrl: standard.imageUrl,
          title: 'Standard Generation',
          description: 'Latest studio-generated standard sample',
          isFallback: false,
        }
      : {
          ...fallback.standard,
          isFallback: true,
        },
  };
}

export async function loadHomepageComparisonSamples() {
  const fallback = {
    quantum: {
      imageUrl: '/images/ai-gen-1.png',
      title: 'Real Quantum Generation',
      description: 'Pinned studio-generated quantum sample',
    },
    standard: {
      imageUrl: '/images/ai-gen-2.png',
      title: 'Standard Generation',
      description: 'Pinned studio-generated standard sample',
    },
  };

  try {
    const supabase = getServiceSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('gallery_items')
        .select('id,image_url,created_at,is_quantum_verified')
        .order('created_at', { ascending: false })
        .limit(24);

      if (!error && Array.isArray(data)) {
        const records = data.map((item) => ({
          id: String(item.id),
          imageUrl: typeof item.image_url === 'string' ? item.image_url : '',
          createdAt: typeof item.created_at === 'string' ? item.created_at : '',
          isQuantumVerified: Boolean(item.is_quantum_verified),
        }));
        return pickHomepageComparisonSamples(records, fallback);
      }
    }
  } catch {
  }

  return pickHomepageComparisonSamples(
    getGalleryItems().map((item: GalleryItem) => ({
      id: item.id,
      imageUrl: item.imageUrl,
      createdAt: item.createdAt,
      isQuantumVerified: item.isQuantumVerified,
    })),
    fallback,
  );
}
