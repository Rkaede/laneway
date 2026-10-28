import { createStore } from 'solid-js/store';

import { imageCache } from '~/services/image-cache';

import { deserializeChatStore, serializeChatStore } from './chat-persistence';
import { createDefaultState, defaults } from './default-state';
import { makePersistedStore } from './persisted';

export const [store, setStore] = makePersistedStore(createStore(createDefaultState()), {
  name: 'chat-store',
  serialize: serializeChatStore,
  deserialize: deserializeChatStore,
});

// migrations
if (store.settings.messages === undefined) {
  setStore('settings', 'messages', defaults.settings.messages);
}

if (store.settings.messages.showAvatars === undefined) {
  setStore('settings', 'messages', 'showAvatars', defaults.settings.messages.showAvatars);
}

if (store.settings.messages.showModelTitle === undefined) {
  setStore('settings', 'messages', 'showModelTitle', defaults.settings.messages.showModelTitle);
}

if (store.settings.completions === undefined) {
  setStore('settings', 'completions', defaults.settings.completions);
}

if (store.featureFlags === undefined) {
  setStore('featureFlags', defaults.featureFlags);
}

if (store.speedDial === undefined) {
  setStore('speedDial', defaults.speedDial);
}

if (store.settings.noteModel === undefined) {
  setStore('settings', 'noteModel', defaults.settings.noteModel);
}

if (store.settings.tts === undefined) {
  setStore('settings', 'tts', {
    enabled: true,
    service: 'openai',
    openai: {
      voice: 'alloy',
    },
  });
}

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
  return true;
};
