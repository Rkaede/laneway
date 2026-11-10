import { describe, expect, it, mock } from 'bun:test';
import { createStore } from 'solid-js/store';

import { createDefaultState, defaults } from './default-state';
import { migrateStore } from './migrations';

function createLegacyState() {
  const state = JSON.parse(JSON.stringify(createDefaultState()));
  delete state.schemaVersion;
  return state;
}

describe('store migrations', () => {
  it.each([undefined, 0])(
    'backfills schema version %p without changing saved data',
    (version) => {
      const state = createLegacyState();
      state.schemaVersion = version;
      state.sessions[0].title = 'Saved session';
      const expected = { ...JSON.parse(JSON.stringify(state)), schemaVersion: 2 };
      delete state.settings.messages;
      delete state.settings.completions;
      delete state.featureFlags;
      delete state.speedDial;
      delete state.settings.noteModel;
      delete state.settings.tts;
      delete state.settings.theme;
      const [store, setStore] = createStore<ReturnType<typeof createDefaultState>>(state);

      migrateStore(store, setStore);

      expect(store).toEqual(expected);
      expect(store.settings.theme).toBe('system');
    },
  );

  it.each(['showAvatars', 'showModelTitle'] as const)(
    'backfills %s while preserving the other message preference',
    (key) => {
      const state = createLegacyState();
      state.settings.messages = { showAvatars: true, showModelTitle: true };
      delete state.settings.messages[key];
      const [store, setStore] = createStore<ReturnType<typeof createDefaultState>>(state);

      migrateStore(store, setStore);

      expect(store.settings.messages).toEqual({
        showAvatars: true,
        showModelTitle: true,
        [key]: false,
      });
      expect(store.schemaVersion).toBe(2);
    },
  );

  it.each(['system', 'light', 'dark'] as const)(
    'preserves a saved %s theme and settings',
    (theme) => {
      const state = createLegacyState();
      state.settings.theme = theme;
      state.settings.messages = { showAvatars: true, showModelTitle: true };
      state.settings.completions = { enabled: true, model: 'saved-model' };
      state.featureFlags = { completions: true };
      state.speedDial = [];
      state.settings.noteModel = { type: 'assistant', referenceId: 'saved-assistant' };
      const expected = {
        ...JSON.parse(JSON.stringify(state)),
        settings: {
          ...JSON.parse(JSON.stringify(state.settings)),
          tts: { ...createDefaultState().settings.tts, enabled: false },
        },
        schemaVersion: 2,
      };
      state.settings.tts = { enabled: false, service: 'openai', openai: { voice: 'echo' } };
      const [store, setStore] = createStore<ReturnType<typeof createDefaultState>>(state);

      migrateStore(store, setStore);

      expect(store).toEqual(expected);
    },
  );

  it('keeps the shared defaults out of the migrated store', () => {
    const state = createLegacyState();
    delete state.settings.messages;
    delete state.settings.completions;
    delete state.featureFlags;
    delete state.speedDial;
    delete state.settings.noteModel;
    delete state.settings.tts;
    const [store, setStore] = createStore<ReturnType<typeof createDefaultState>>(state);
    const before = structuredClone(defaults);

    migrateStore(store, setStore);
    setStore('settings', 'messages', 'showAvatars', true);
    setStore('settings', 'completions', 'model', 'saved-model');
    setStore('featureFlags', 'completions', true);
    setStore('speedDial', 0, 'title', 'Renamed');
    setStore('settings', 'noteModel', 'referenceId', 'saved-assistant');
    setStore('settings', 'tts', 'voice', 'saved-voice');

    expect(defaults).toEqual(before);
    expect(store.settings.messages.showAvatars).toBe(true);
    expect(store.speedDial[0].title).toBe('Renamed');
  });

  it('does not rerun completed migrations', () => {
    const state = createLegacyState();
    delete state.settings.theme;
    const [store, setStore] = createStore<ReturnType<typeof createDefaultState>>(state);
    migrateStore(store, setStore);
    setStore('settings', 'theme', 'light');
    const set = mock(() => {});

    migrateStore(store, set);

    expect(store.settings.theme).toBe('light');
    expect(set).not.toHaveBeenCalled();
  });

  it('moves speech to an OpenRouter model and drops the OpenRouter usage setting', () => {
    const state = JSON.parse(JSON.stringify(createDefaultState()));
    state.schemaVersion = 1;
    state.settings.tts = { enabled: false, service: 'openai', openai: { voice: 'echo' } };
    state.settings.openRouterUsage = 'always';
    const [store, setStore] = createStore<ReturnType<typeof createDefaultState>>(state);

    migrateStore(store, setStore);

    expect(store.settings.tts).toEqual({
      ...createDefaultState().settings.tts,
      enabled: false,
    });
    expect(store.settings).not.toHaveProperty('openRouterUsage');
    expect(store.schemaVersion).toBe(2);
  });

  it.each([2, 3])('does not rewrite schema version %s', (schemaVersion) => {
    const state = createDefaultState();
    state.schemaVersion = schemaVersion;
    const set = mock(() => {});

    migrateStore(state, set);

    expect(state.schemaVersion).toBe(schemaVersion);
    expect(set).not.toHaveBeenCalled();
  });

  it('initializes new and reset stores at the current schema version', () => {
    expect(createDefaultState().schemaVersion).toBe(2);
  });
});
