import { createStore, unwrap } from 'solid-js/store';

import { getDatabase } from '~/db/client';
import { createDatabaseSync } from '~/db/sync';
import { imageCache } from '~/services/image-cache';

import { deserializeSnapshot, serializeSnapshot } from './chat-persistence';
import { createDefaultState } from './default-state';
import { migrateStore } from './migrations';
import { makePersistedStore } from './persisted';

/** Sessions deleted before the last sync could save that, read from the snapshot at startup. */
let startupDeletes: string[] = [];

export const databaseSync = createDatabaseSync({
  getDatabase,
  getState: () => unwrap(store),
});

/** The localStorage key of the snapshot. */
export const SNAPSHOT_KEY = 'chat-store';

const persisted = makePersistedStore(createStore(createDefaultState()), {
  name: SNAPSHOT_KEY,
  // The snapshot is large and the store changes on every streamed token.
  deferSerialize: true,
  onChange: () => databaseSync.schedule(),
  serialize: (state) =>
    serializeSnapshot(state, {
      isPersisted: databaseSync.isPersisted,
      pendingDeletes: [
        ...new Set([...startupDeletes, ...databaseSync.pendingDeletes(unwrap(state))]),
      ],
      generation: databaseSync.generation(),
    }),
  deserialize: (serialized) => {
    const snapshot = deserializeSnapshot(serialized);
    startupDeletes = snapshot.pendingDeletes;
    databaseSync.setGeneration(snapshot.generation);
    return snapshot.state;
  },
});

// With no snapshot, the store is new, and so is any data it is saved over.
if (databaseSync.generation() === undefined) databaseSync.setGeneration(null);

export const [store, setStore] = persisted;

/** Writes the snapshot again, after a sync changes which messages it needs to keep. */
export const saveSnapshot = persisted.save;

/** Writes the snapshot now, before another tab reads it. */
export function writeSnapshotNow() {
  persisted.save();
  persisted.flush();
}

/** Stops saving the snapshot, before a reload that must not overwrite what another tab saved. */
export const closeSnapshot = persisted.close;

/** Takes the deletes read at startup, which the first sync carries out. */
export function takeStartupDeletes() {
  const deletes = startupDeletes;
  startupDeletes = [];
  return deletes;
}

migrateStore(store, setStore);

export const deleteData = () => {
  if (
    !window.confirm(
      'Delete all your chats, notes, messages, images, assistants, and presets, and reset settings?\n\nThis cannot be undone. API keys will be kept. Export your data first if you need a backup.',
    )
  ) {
    return false;
  }
  for (const chat of [...store.chats, ...store.draftChats]) chat.controller?.abort();
  setStore(createDefaultState());
  imageCache.clearAll();
  if (typeof caches !== 'undefined') caches.delete('laneway-tts-cache');
  return true;
};
