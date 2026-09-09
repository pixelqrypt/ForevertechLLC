export interface GalleryItem {
  id: string;
  imageUrl: string;
  prompt: string;
  userName: string;
  catalogName: string;
  userId?: string;
  deviceId?: string;
  isFavorite: boolean;
  createdAt: string;
  isQuantumVerified?: boolean;
  isNft?: boolean;
  nftId?: string;
  visibility?: 'public' | 'private';
}

declare global {
  var galleryStore: GalleryItem[];
}

if (!global.galleryStore) {
  global.galleryStore = [
    {
      id: 'mock-1',
      imageUrl: 'https://picsum.photos/seed/1/512/512',
      prompt: 'A futuristic cyber city with neon lights',
      userName: 'Neo',
      catalogName: 'Neo\'s Cyberpunk Collection',
      userId: 'neo-123',
      isFavorite: true,
      isQuantumVerified: true,
      createdAt: new Date().toISOString(),
      visibility: 'public',
    }
  ];
}

const normalizeVisibility = (value: GalleryItem['visibility']) => (value === 'private' ? 'private' : 'public');

const normalizeGalleryItem = (item: GalleryItem): GalleryItem => ({
  ...item,
  visibility: normalizeVisibility(item.visibility),
});

export const getGalleryItems = () => global.galleryStore.map(normalizeGalleryItem);

export const addGalleryItem = (
  item: Omit<GalleryItem, 'id' | 'createdAt' | 'isFavorite' | 'isQuantumVerified' | 'isNft' | 'nftId'> &
    Partial<Pick<GalleryItem, 'isQuantumVerified' | 'isNft' | 'nftId'>>
) => {
  const newItem: GalleryItem = {
    ...item,
    id: `gal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    isFavorite: false,
    isQuantumVerified: item.isQuantumVerified || false,
    isNft: item.isNft || false,
    nftId: item.nftId,
    createdAt: new Date().toISOString(),
    visibility: normalizeVisibility(item.visibility),
  };
  global.galleryStore = [newItem, ...global.galleryStore];
  return normalizeGalleryItem(newItem);
};

export const toggleFavorite = (id: string) => {
  const item = global.galleryStore.find(i => i.id === id);
  if (item) {
    item.isFavorite = !item.isFavorite;
  }
  return item ? normalizeGalleryItem(item) : item;
};

export const updateGalleryItemVisibility = (id: string, visibility: 'public' | 'private') => {
  const item = global.galleryStore.find((candidate) => candidate.id === id);
  if (!item) return null;
  item.visibility = normalizeVisibility(visibility);
  return normalizeGalleryItem(item);
};
