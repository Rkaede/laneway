import { produce, type SetStoreFunction } from 'solid-js/store';

import { createDefaultState, defaults, type State } from './default-state';

export function migrateStore(store: State, setStore: SetStoreFunction<State>) {
  if ((store.schemaVersion ?? 0) < 1) {
    // The store keeps the objects it is given, so they must not belong to the shared `defaults`.
    const fresh = createDefaultState();
    if (store.settings.messages === undefined) {
      setStore('settings', 'messages', fresh.settings.messages);
    }

    if (store.settings.messages.showAvatars === undefined) {
      setStore('settings', 'messages', 'showAvatars', fresh.settings.messages.showAvatars);
    }

    if (store.settings.messages.showModelTitle === undefined) {
      setStore(
        'settings',
        'messages',
        'showModelTitle',
        fresh.settings.messages.showModelTitle,
      );
    }

    if (store.settings.completions === undefined) {
      setStore('settings', 'completions', fresh.settings.completions);
    }

    if (store.featureFlags === undefined) {
      setStore('featureFlags', fresh.featureFlags);
    }

    if (store.speedDial === undefined) {
      setStore('speedDial', fresh.speedDial);
    }

    if (store.settings.noteModel === undefined) {
      setStore('settings', 'noteModel', fresh.settings.noteModel);
    }

    if (store.settings.tts === undefined) {
      setStore('settings', 'tts', fresh.settings.tts);
    }

    if (store.settings.theme === undefined) {
      setStore('settings', 'theme', fresh.settings.theme);
    }

    setStore('schemaVersion', 1);
  }

  if ((store.schemaVersion ?? 0) < 2) {
    // Laneway now talks only to OpenRouter. Speech moved from OpenAI's voices to an OpenRouter
    // model and voice, and the setting for when to use OpenRouter is gone.
    setStore(
      'settings',
      produce((settings: State['settings'] & { openRouterUsage?: unknown }) => {
        settings.tts = {
          ...defaults.settings.tts,
          enabled: settings.tts?.enabled ?? defaults.settings.tts.enabled,
        };
        delete settings.openRouterUsage;
      }),
    );
    setStore('schemaVersion', 2);
  }

  if ((store.schemaVersion ?? 0) < 3) {
    if (store.settings.streaming === undefined) {
      setStore('settings', 'streaming', defaults.settings.streaming);
    }
    setStore('schemaVersion', 3);
  }

  if ((store.schemaVersion ?? 0) < 4) {
    // Stores saved with a streaming display setting but before the cursor setting existed.
    if (store.settings.streaming.cursor === undefined) {
      setStore('settings', 'streaming', 'cursor', defaults.settings.streaming.cursor);
    }
    setStore('schemaVersion', 4);
  }
}
