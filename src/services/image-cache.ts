export const IMAGE_CACHE_NAME = 'laneway-image-cache';

function normalize(url: string) {
  if (url.startsWith('http')) return url;
  return url.startsWith('/') ? url : '/' + url;
}

function imageStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(IMAGE_CACHE_NAME, 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('images');
    };
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      try {
        const transaction = db.transaction('images', mode);
        const result = operation(transaction.objectStore('images'));
        transaction.oncomplete = () => {
          db.close();
          resolve(result.result);
        };
        transaction.onabort = () => {
          db.close();
          reject(transaction.error ?? result.error ?? new Error('Image storage aborted'));
        };
      } catch (error) {
        db.close();
        reject(error);
      }
    };
  });
}

export const imageCache = {
  get available() {
    return typeof caches !== 'undefined' || typeof indexedDB !== 'undefined';
  },
  async add(imageUrl: string, imageBlob: Blob): Promise<void> {
    if (typeof caches === 'undefined') {
      await imageStore('readwrite', (store) => store.put(imageBlob, normalize(imageUrl)));
      return;
    }

    const cache = await caches.open(IMAGE_CACHE_NAME);
    await cache.put(normalize(imageUrl), new Response(imageBlob));
  },

  async remove(imageUrl: string): Promise<void> {
    if (typeof caches === 'undefined') {
      await imageStore('readwrite', (store) => store.delete(normalize(imageUrl)));
      return;
    }
    const cache = await caches.open(IMAGE_CACHE_NAME);
    await cache.delete(normalize(imageUrl));
  },

  async clearAll(): Promise<void> {
    if (typeof caches === 'undefined') {
      await imageStore('readwrite', (store) => store.clear());
      return;
    }
    await caches.delete(IMAGE_CACHE_NAME);
  },

  async get(imageUrl: string): Promise<Blob | null> {
    if (typeof caches === 'undefined') {
      const image = await imageStore<Blob | undefined>('readonly', (store) =>
        store.get(normalize(imageUrl)),
      );
      return image ?? null;
    }

    const cache = await caches.open(IMAGE_CACHE_NAME);
    const response = await cache.match(normalize(imageUrl));
    if (!response) return null;

    const blob = await response?.blob();
    return blob;
  },
};
