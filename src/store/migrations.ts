import type { SetStoreFunction } from 'solid-js/store';

import { createDefaultState, defaults } from './default-state';

type State = ReturnType<typeof createDefaultState>;

export function migrateStore(store: State, setStore: SetStoreFunction<State>) {
  if ((store.schemaVersion ?? 0) < 1) {
    if (store.settings.messages === undefined) {
      setStore('settings', 'messages', defaults.settings.messages);
    }

    if (store.settings.messages.showAvatars === undefined) {
      setStore('settings', 'messages', 'showAvatars', defaults.settings.messages.showAvatars);
    }

    if (store.settings.messages.showModelTitle === undefined) {
      setStore(
        'settings',
        'messages',
        'showModelTitle',
        defaults.settings.messages.showModelTitle,
      );
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
      setStore('settings', 'tts', defaults.settings.tts);
    }

    if (store.settings.theme === undefined) {
      setStore('settings', 'theme', defaults.settings.theme);
    }

    setStore('schemaVersion', 1);
  }
}
