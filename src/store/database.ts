import { batch, createSignal } from 'solid-js';
import { unwrap } from 'solid-js/store';

import { getDatabase, scheduleCheckpoint } from '~/db/client';
import { loadMessages, type SyncResult } from '~/db/sync';
import { imageCache } from '~/services/image-cache';
import type { ChatProps, MessageProps } from '~/types';

import { chatImageIds } from './branches';
import { databaseSync, saveSnapshot, setStore, store, takeStartupDeletes } from './index';

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
  const state = unwrap(store);
  for (const id of unusedImages(result.orphanedImages, [...state.chats, ...state.draftChats])) {
    imageCache.remove(id);
  }
}

let starting: Promise<void> | undefined;

/**
 * Opens the database after the app has drawn from the snapshot. The first sync saves anything the
 * database lacks, which on the first run after updating is every chat in localStorage.
 */
export function startDatabase() {
  starting ??= (async () => {
    try {
      const missing = await databaseSync.prime(takeStartupDeletes());
      if (missing.sessions.length) {
        // Sessions another tab saved after this tab's snapshot was written.
        batch(() => {
          setStore('sessions', (sessions) => [...sessions, ...missing.sessions]);
          setStore('chats', (chats) => [...chats, ...missing.chats]);
        });
      }
      databaseSync.start(afterSync);
      afterSync(await databaseSync.sync());
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

/** Messages read for search and export, which do not load chats into the store. */
const readOnly = new Map<string, MessageProps[]>();

/**
 * The chats with every message, reading unloaded ones from the database without loading them.
 * Search and backups need every message until they read the database directly.
 */
export async function chatsWithMessages(chats: ChatProps[]) {
  const missing = chats.filter((chat) => chat.unloaded && !readOnly.has(chat.id));
  if (missing.length) {
    const loaded = await loadMessages(
      await getDatabase(),
      missing.map((chat) => chat.id),
    );
    for (const [chatId, messages] of loaded) readOnly.set(chatId, messages);
  }
  return chats.map((chat) => {
    if (!chat.unloaded) return chat;
    const { unloaded: _unloaded, ...rest } = chat;
    return { ...rest, messages: readOnly.get(chat.id) ?? [] };
  });
}

/** The whole state with every message, as a backup needs it. */
export async function completeState() {
  const state = unwrap(store);
  return { ...state, chats: await chatsWithMessages(state.chats) };
}
