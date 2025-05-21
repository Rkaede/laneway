import { makePersisted } from '@solid-primitives/storage';
import { createStore } from 'solid-js/store';

import { imageCache } from '~/services/image-cache';

import { createDefaultState, defaults } from './default-state';

export const [store, setStore] = makePersisted(createStore(createDefaultState()), {
  name: 'chat-store',
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
  setStore(createDefaultState());
  imageCache.clearAll();
};
