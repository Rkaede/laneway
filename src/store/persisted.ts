import { makePersisted, type PersistenceOptions } from '@solid-primitives/storage';
import { getOwner, onCleanup } from 'solid-js';
import type { SetStoreFunction, Store } from 'solid-js/store';

/** A value to save, or a function that produces it when the save happens. */
type PendingValue = string | (() => string);

const resolve = (value: PendingValue) => (typeof value === 'function' ? value() : value);

export function createDebouncedStorage() {
  const pending = new Map<string, PendingValue>();
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
        storage?.setItem(key, resolve(value));
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
      const value = pending.get(key);
      return value === undefined
        ? (access(() => storage?.getItem(key)) ?? null)
        : resolve(value);
    },
    setItem(key: string, value: PendingValue) {
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

const DEFERRED = '\u0000deferred';

// @solid-primitives/storage 4.4 no longer infers the store type from its argument.
export function makePersistedStore<T extends object>(
  store: [Store<T>, SetStoreFunction<T>],
  options: { name: string } & Pick<
    PersistenceOptions<T, undefined>,
    'serialize' | 'deserialize'
  > & {
      /**
       * Serialise when the debounced save runs rather than on every change. For a large store that
       * changes on every streamed token.
       */
      deferSerialize?: boolean;
      /** Called after every change to the store. */
      onChange?: () => void;
    },
) {
  const { deferSerialize, onChange, ...persistence } = options;
  const storage = createDebouncedStorage();
  const serialize = persistence.serialize ?? ((state: T) => JSON.stringify(state));
  let state: T | undefined;
  const persisted = makePersisted<T, [Store<T>, SetStoreFunction<T>]>(store, {
    ...persistence,
    serialize(value) {
      onChange?.();
      if (!deferSerialize) return serialize(value);
      state = value;
      return DEFERRED;
    },
    storage: {
      ...storage,
      setItem: (key: string, value: string) =>
        storage.setItem(key, value === DEFERRED ? () => serialize(state!) : value),
    },
  });
  return Object.assign(persisted, {
    /** Saves the store again, for when its serialised form changes without a store change. */
    save: () => storage.setItem(options.name, () => serialize(persisted[0])),
  });
}
