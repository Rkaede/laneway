import { createStore } from 'solid-js/store';

import { imageCache } from '~/services/image-cache';

import { deserializeChatStore, serializeChatStore } from './chat-persistence';
import { createDefaultState } from './default-state';
import { migrateStore } from './migrations';
import { makePersistedStore } from './persisted';

export const [store, setStore] = makePersistedStore(createStore(createDefaultState()), {
  name: 'chat-store',
  serialize: serializeChatStore,
  deserialize: deserializeChatStore,
});

migrateStore(store, setStore);

export const deleteData = () => {
  if (
    !window.confirm(
      'Delete all your chats, notes, messages, images, assistants, and presets, and reset settings?\n\nThis cannot be undone. API keys will be kept. Export your data first if you need a backup.',
    )
  ) {
    return false;
  }
  setStore(createDefaultState());
  imageCache.clearAll();
  if (typeof caches !== 'undefined') caches.delete('laneway-tts-cache');
  return true;
};
