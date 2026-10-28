import { makePersisted, type PersistenceOptions } from '@solid-primitives/storage';
import type { SetStoreFunction, Store } from 'solid-js/store';

// @solid-primitives/storage 4.4 no longer infers the store type from its argument, so the
// generics are spelled out here once instead of at every call site.
export function makePersistedStore<T extends object>(
  store: [Store<T>, SetStoreFunction<T>],
  options: { name: string } & Pick<
    PersistenceOptions<T, undefined>,
    'serialize' | 'deserialize'
  >,
) {
  return makePersisted<T, [Store<T>, SetStoreFunction<T>]>(store, options);
}
