export const cacheAvailable = 'caches' in self;

export const IMAGE_CACHE_NAME = 'laneway-image-cache';

export const imageCache = {
  available: cacheAvailable,
  async add(imageUrl: string, imageBlob: Blob): Promise<void> {
    if (!cacheAvailable) return;

    const cache = await caches.open(IMAGE_CACHE_NAME);
    await cache.put(imageUrl, new Response(imageBlob));
  },

  async remove(imageUrl: string): Promise<void> {
    if (!cacheAvailable) return;
    const cache = await caches.open(IMAGE_CACHE_NAME);
    await cache.delete(imageUrl);
  },

  async clearAll(): Promise<void> {
    if (!cacheAvailable) return;
    await caches.delete(IMAGE_CACHE_NAME);
  },

  async get(imageUrl: string): Promise<Blob | null> {
    if (!cacheAvailable) return null;

    const cache = await caches.open(IMAGE_CACHE_NAME);
    const response = await cache.match(imageUrl);
    if (!response) return null;

    const blob = await response?.blob();
    return blob;
  },
};
