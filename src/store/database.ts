import type { PGliteInterface } from '@electric-sql/pglite';
import { batch, createSignal } from 'solid-js';
import { reconcile, unwrap } from 'solid-js/store';

import { restoreDatabase } from '~/db/backup';
import { getDatabase, scheduleCheckpoint } from '~/db/client';
import { documentIds } from '~/db/documents';
import { storedImageIds } from '~/db/images';
import { DataReplacedError, loadMessages, readGeneration, type SyncResult } from '~/db/sync';
import { documentFiles } from '~/services/document-files';
import { imageCache } from '~/services/image-cache';
import type { ChatProps } from '~/types';

import {
  type ArchiveBackup,
  type Backup,
  exportBackup,
  restoreBackup,
  stateImageIds,
} from './backup';
import { chatImageIds } from './branches';
import { deserializeSnapshot } from './chat-persistence';
import type { State } from './default-state';
import {
  closeSnapshot,
  databaseSync,
  saveSnapshot,
  setStore,
  SNAPSHOT_KEY,
  store,
  takeStartupDeletes,
  writeSnapshotNow,
} from './index';
import { scheduleIndexing, stopEmbedding } from './indexer';

const [databaseError, setDatabaseError] = createSignal<Error>();

/** Set when the database cannot open. Chats whose messages are not loaded cannot be shown. */
export { databaseError };

/**
 * Images the sync found unused in the database, less any that an unsaved chat in memory still
 * shows. A fork shares its parent's images, and may not be saved yet.
 */
export function unusedImages(orphaned: string[], chats: Pick<ChatProps, 'messages'>[]) {
  const inUse = chatImageIds(chats);
  return orphaned.filter((id) => !inUse.has(id));
}

function afterSync(result: SyncResult) {
  if (!result.wrote) return;
  // Chats the database now holds can drop their messages from the snapshot.
  saveSnapshot();
  scheduleCheckpoint();
  scheduleIndexing();
  const state = unwrap(store);
  for (const id of unusedImages(result.orphanedImages, [...state.chats, ...state.draftChats])) {
    imageCache.remove(id);
  }
}

function startSync() {
  databaseSync.start(afterSync, { replaced: () => void recover() });
}

/** Saves the store's changes now, recovering if another tab replaced the data meanwhile. */
async function syncNow() {
  try {
    afterSync(await databaseSync.sync());
  } catch (error) {
    if (!(error instanceof DataReplacedError)) throw error;
    await recover();
  }
}

/**
 * Rebuilds the store's sessions and chats from the database, keeping `rest` for everything else,
 * and saves from then on against the data's current generation.
 */
async function rebuildFromDatabase(rest: State, generation: string | null) {
  databaseSync.reset();
  databaseSync.setGeneration(generation);
  const saved = await databaseSync.prime([], { sessions: [], chats: [] });
  setStore(reconcile({ ...rest, sessions: saved.sessions, chats: saved.chats }));
  startSync();
}

let recovering: Promise<void> | undefined;

/**
 * Called when another tab replaced the data after this tab read its store, so the store's changes
 * must be dropped. Uses the snapshot that tab saved for settings, assistants and presets when it
 * matches the data, and otherwise keeps this tab's.
 */
function recover() {
  recovering ??= (async () => {
    try {
      await databaseSync.stop();
      stopEmbedding();
      for (const chat of [...store.chats, ...store.draftChats]) chat.controller?.abort();
      const generation = await readGeneration(await getDatabase());
      let rest: State = unwrap(store);
      try {
        const saved = deserializeSnapshot(localStorage.getItem(SNAPSHOT_KEY) ?? '');
        if (saved.generation === generation) rest = saved.state;
      } catch {
        // No readable snapshot, so this tab's store is the best there is.
      }
      await rebuildFromDatabase(rest, generation);
      writeSnapshotNow();
    } catch (error) {
      console.error('Unable to reload replaced data.', error);
      setDatabaseError(error instanceof Error ? error : new Error(String(error)));
    } finally {
      recovering = undefined;
    }
  })();
  return recovering;
}

let starting: Promise<void> | undefined;

const STARTUP_INDEXING_DELAY = 3000;

/**
 * Opens the database after the app has drawn from the snapshot. The first sync saves anything the
 * database lacks, which on the first run after updating is every chat in localStorage.
 */
export function startDatabase() {
  starting ??= (async () => {
    listenForReplacedData();
    try {
      const missing = await databaseSync.prime(takeStartupDeletes());
      if (missing.sessions.length) {
        // Sessions another tab saved after this tab's snapshot was written.
        batch(() => {
          setStore('sessions', (sessions) => [...sessions, ...missing.sessions]);
          setStore('chats', (chats) => [...chats, ...missing.chats]);
        });
      }
      startSync();
      await syncNow();
      // Messages saved before search used the database, or by a tab that closed before indexing
      // them. A first run can take a while, so it waits until the app has settled.
      scheduleIndexing(STARTUP_INDEXING_DELAY);
    } catch (error) {
      console.error('Unable to open the database.', error);
      setDatabaseError(error instanceof Error ? error : new Error(String(error)));
    }
  })();
  return starting;
}

const loading = new Map<string, Promise<void>>();

/** Loads the messages of any of these chats that are not loaded yet. */
export function loadChats(chatIds: string[]) {
  const ids = chatIds.filter(
    (id) => !loading.has(id) && store.chats.some((chat) => chat.id === id && chat.unloaded),
  );
  if (ids.length) {
    const load = (async () => {
      try {
        const loaded = await loadMessages(await getDatabase(), ids);
        batch(() => {
          for (const [chatId, messages] of loaded) {
            // Recorded first, so the sync this store change starts does not write them back.
            databaseSync.markLoaded(chatId, messages);
            setStore('chats', (chat) => chat.id === chatId && !!chat.unloaded, {
              messages,
              unloaded: undefined,
            });
          }
        });
      } finally {
        for (const id of ids) loading.delete(id);
      }
    })();
    for (const id of ids) loading.set(id, load);
  }
  return Promise.all(chatIds.map((id) => loading.get(id)));
}

/** Opens the database for a backup, which needs every change saved first. */
async function readyDatabase() {
  await startDatabase();
  const error = databaseError();
  if (error) throw error;
  await syncNow();
  return getDatabase();
}

/** Downloads a backup of everything. Returns how many images were missing from storage. */
export async function exportAllData() {
  return exportBackup(unwrap(store), await readyDatabase());
}

/**
 * Replaces the database with an archive's tables, then rebuilds the store from it. Until the
 * database commits, a failure leaves everything as it was.
 */
async function restoreArchive(backup: ArchiveBackup) {
  const db = await readyDatabase();
  await databaseSync.stop();
  stopEmbedding();
  const added: string[] = [];
  const addedDocuments: string[] = [];
  let result: Awaited<ReturnType<typeof restoreDatabase>>;
  try {
    for (const [id, blob] of backup.images) {
      await imageCache.add(id, blob);
      added.push(id);
    }
    for (const [id, blob] of backup.documents) {
      await documentFiles.add(id, blob);
      addedDocuments.push(id);
    }
    result = await restoreDatabase(db, backup.database);
  } catch (error) {
    // Image and document ids are unique, so an added file is one the current data already had
    // only if it still uses it.
    const inUse = new Set([
      ...(await storedImageIds(db).catch(() => added)),
      ...stateImageIds(unwrap(store)),
    ]);
    await Promise.allSettled(added.filter((id) => !inUse.has(id)).map(imageCache.remove));
    const documentsInUse = new Set(await documentIds(db).catch(() => addedDocuments));
    await Promise.allSettled(
      addedDocuments.filter((id) => !documentsInUse.has(id)).map(documentFiles.remove),
    );
    startSync();
    throw error;
  }

  for (const chat of [...store.chats, ...store.draftChats]) chat.controller?.abort();
  await rebuildFromDatabase(backup.state, result.generation);
  scheduleCheckpoint();
  scheduleIndexing();

  const kept = new Set([...result.images, ...stateImageIds(backup.state)]);
  for (const id of result.previousImages) if (!kept.has(id)) void imageCache.remove(id);
  await removeUnusedDocumentFiles(db);
}

/** Removes original files of documents the database no longer has. */
async function removeUnusedDocumentFiles(db: PGliteInterface) {
  try {
    const kept = new Set(await documentIds(db));
    const unused = (await documentFiles.ids()).filter((id) => !kept.has(id));
    await Promise.allSettled(unused.map(documentFiles.remove));
  } catch (error) {
    console.warn('Unable to remove unused document files.', error);
  }
}

/** Replaces all data with a backup's, and reloads other tabs so they do not save over it. */
export async function importBackup(backup: Backup) {
  if (backup.kind === 'archive') {
    await restoreArchive(backup);
  } else {
    await restoreBackup(backup, store, setStore);
    // Save to the database before other tabs reload and read it.
    await startDatabase();
    if (!databaseError()) await syncNow();
  }
  announceDataReplaced();
}

/**
 * Saves the snapshot now and reloads other tabs, after this tab replaced or deleted all data.
 * Their stores are out of date, and saving them would bring back what was replaced.
 */
export function announceDataReplaced() {
  writeSnapshotNow();
  channel?.postMessage(DATA_REPLACED);
}

const DATA_REPLACED = 'data-replaced';
let channel: BroadcastChannel | undefined;

function listenForReplacedData() {
  if (channel || typeof BroadcastChannel === 'undefined') return;
  channel = new BroadcastChannel('laneway-data');
  channel.addEventListener('message', (event) => {
    if (event.data !== DATA_REPLACED) return;
    closeSnapshot();
    stopEmbedding();
    void databaseSync.stop();
    window.location.reload();
  });
}
