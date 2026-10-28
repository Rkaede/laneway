import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { IDBFactory, IDBObjectStore } from 'fake-indexeddb';

import { IMAGE_CACHE_NAME, imageCache } from './image-cache';

const descriptors = ['caches', 'indexedDB'].map(
  (key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const,
);

beforeEach(() => {
  Reflect.deleteProperty(globalThis, 'caches');
  Object.defineProperty(globalThis, 'indexedDB', {
    configurable: true,
    value: new IDBFactory(),
  });
});

afterEach(() => {
  mock.restore();
  for (const [key, descriptor] of descriptors) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
});

describe('imageCache', () => {
  it('persists image bytes and types across IndexedDB connections without Cache Storage', async () => {
    expect(imageCache.available).toBe(true);
    expect(await imageCache.get('missing.png')).toBeNull();
    await imageCache.add('photo.png', new File(['image'], 'photo.png', { type: 'image/png' }));

    const image = await imageCache.get('/photo.png');

    expect(image?.type).toBe('image/png');
    expect(await image?.text()).toBe('image');
  });

  it('removes individual images and clears all images without Cache Storage', async () => {
    await imageCache.add('first.png', new Blob(['first']));
    await imageCache.add('/second.png', new Blob(['second']));

    await imageCache.remove('/first.png');

    expect(await imageCache.get('first.png')).toBeNull();
    expect(await (await imageCache.get('second.png'))?.text()).toBe('second');

    await imageCache.clearAll();

    expect(await imageCache.get('second.png')).toBeNull();
  });

  it('rejects failed writes instead of silently losing attachments', async () => {
    const put = IDBObjectStore.prototype.put;
    spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (
      this: IDBObjectStore,
      value,
      key,
    ) {
      const request = put.call(this, value, key);
      this.transaction.abort();
      return request;
    });

    await expect(imageCache.add('photo.png', new Blob(['image']))).rejects.toThrow();
    expect(await imageCache.get('photo.png')).toBeNull();
  });

  it('propagates database open failures', async () => {
    spyOn(indexedDB, 'open').mockImplementation(() => {
      throw new DOMException('Storage blocked', 'SecurityError');
    });

    await expect(imageCache.add('photo.png', new Blob(['image']))).rejects.toThrow(
      'Storage blocked',
    );
  });

  it('keeps using existing Cache Storage images when available', async () => {
    const responses = new Map<string, Response>([
      ['/existing.png', new Response(new Blob(['existing'], { type: 'image/png' }))],
    ]);
    const cache = {
      match: mock(async (key: string) => responses.get(key)?.clone()),
      put: mock(async (key: string, response: Response) => {
        responses.set(key, response);
      }),
      delete: mock(async (key: string) => responses.delete(key)),
    };
    const storage = {
      open: mock(async () => cache),
      delete: mock(async () => true),
    };
    Object.defineProperty(globalThis, 'caches', { configurable: true, value: storage });
    const openDatabase = spyOn(indexedDB, 'open');

    expect(await (await imageCache.get('existing.png'))?.text()).toBe('existing');
    await imageCache.add('new.png', new Blob(['new']));
    expect(await (await imageCache.get('/new.png'))?.text()).toBe('new');
    await imageCache.remove('new.png');
    expect(await imageCache.get('new.png')).toBeNull();
    await imageCache.clearAll();

    expect(storage.open).toHaveBeenCalledWith(IMAGE_CACHE_NAME);
    expect(storage.delete).toHaveBeenCalledWith(IMAGE_CACHE_NAME);
    expect(openDatabase).not.toHaveBeenCalled();
  });
});
