import { makePersisted, type PersistenceOptions } from '@solid-primitives/storage';
import { getOwner, onCleanup } from 'solid-js';
import type { SetStoreFunction, Store } from 'solid-js/store';

export function createDebouncedStorage() {
  const pending = new Map<string, string>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let started: number | undefined;
  let warned = false;

  function access<T>(operation: () => T) {
    try {
      return operation();
    } catch (error) {
      if (!warned)
        console.warn('Unable to access local storage; changes stay in memory.', error);
      warned = true;
    }
  }
  const storage = access(() => globalThis.localStorage);

  function flush() {
    clearTimeout(timer);
    started = undefined;
    for (const [key, value] of pending) {
      access(() => {
        storage?.setItem(key, value);
        pending.delete(key);
      });
    }
  }

  const page = typeof window === 'undefined' ? undefined : window;
  const visibility = typeof document === 'undefined' ? undefined : document;
  function onHidden() {
    if (visibility?.visibilityState === 'hidden') flush();
  }
  page?.addEventListener('pagehide', flush);
  visibility?.addEventListener('visibilitychange', onHidden);
  if (getOwner()) {
    onCleanup(() => {
      flush();
      page?.removeEventListener('pagehide', flush);
      visibility?.removeEventListener('visibilitychange', onHidden);
    });
  }

  return {
    getItem(key: string) {
      return pending.get(key) ?? access(() => storage?.getItem(key)) ?? null;
    },
    setItem(key: string, value: string) {
      pending.set(key, value);
      started ??= performance.now();
      clearTimeout(timer);
      // Save after a pause, but checkpoint continuous streams at least every 500 ms.
      timer = setTimeout(
        flush,
        Math.max(0, Math.min(100, 500 - (performance.now() - started))),
      );
    },
    removeItem(key: string) {
      pending.delete(key);
      if (!pending.size) {
        clearTimeout(timer);
        started = undefined;
      }
      access(() => storage?.removeItem(key));
    },
  };
}

// @solid-primitives/storage 4.4 no longer infers the store type from its argument.
export function makePersistedStore<T extends object>(
  store: [Store<T>, SetStoreFunction<T>],
  options: { name: string } & Pick<
    PersistenceOptions<T, undefined>,
    'serialize' | 'deserialize'
  >,
) {
  return makePersisted<T, [Store<T>, SetStoreFunction<T>]>(store, {
    ...options,
    storage: createDebouncedStorage(),
  });
}
