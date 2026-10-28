import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import type { AssistantProps, PresetProps } from '~/types';

Object.defineProperty(globalThis, 'self', { value: globalThis, configurable: true });
const { setStore, store } = await import('..');
const { addAssistant } = await import('./assistants');
const { addPreset } = await import('./presets');

const originalAssistants = [...store.assistants];
const originalPresets = [...store.presets];
const assistant: AssistantProps = {
  id: 'assistant-template',
  title: 'Gallery Assistant',
  modelId: 'openai/gpt-4o',
  systemPrompt: 'Help with writing.',
};
const preset: PresetProps = {
  id: 'preset-template',
  presetTitle: 'Gallery Preset',
  type: 'chat',
  chats: [{ assistantId: assistant.id, status: 'idle' }],
};

beforeEach(() => {
  setStore('assistants', []);
  setStore('presets', []);
});

afterEach(() => {
  setStore('assistants', originalAssistants);
  setStore('presets', originalPresets);
});

describe('addPreset', () => {
  it('maps gallery assistant references to local IDs without changing templates or models', () => {
    const otherAssistant = { ...assistant, id: 'other-template', title: 'Other Assistant' };
    const input: PresetProps = {
      ...preset,
      chats: [
        ...preset.chats,
        { modelId: 'standalone-model', status: 'idle' },
        { assistantId: otherAssistant.id, status: 'idle' },
      ],
    };

    const id = addPreset(input, [assistant, otherAssistant]);

    expect(store.assistants).toHaveLength(2);
    expect(store.assistants[0]).toMatchObject({
      templateId: assistant.id,
      modelId: assistant.modelId,
      systemPrompt: assistant.systemPrompt,
    });
    expect(store.assistants[0].id).not.toBe(assistant.id);
    expect(store.assistants[1].id).not.toBe(otherAssistant.id);
    expect(store.presets[0]).toMatchObject({ id, templateId: input.id });
    expect(store.presets[0].chats).toEqual([
      { assistantId: store.assistants[0].id, status: 'idle' },
      { modelId: 'standalone-model', status: 'idle' },
      { assistantId: store.assistants[1].id, status: 'idle' },
    ]);
    expect(input.chats[0].assistantId).toBe(assistant.id);
    expect(input.chats[2].assistantId).toBe(otherAssistant.id);
    expect(assistant.id).toBe('assistant-template');
    expect(otherAssistant.id).toBe('other-template');
  });

  it('imports each assistant only once across repeated chats and presets', () => {
    const input: PresetProps = { ...preset, chats: [...preset.chats, ...preset.chats] };

    addPreset(input, [assistant]);
    addPreset({ ...input, id: 'another-preset-template' }, [assistant]);

    expect(store.assistants).toHaveLength(1);
    expect(store.presets).toHaveLength(2);
    for (const savedPreset of store.presets) {
      expect(savedPreset.chats.map((chat) => chat.assistantId)).toEqual([
        store.assistants[0].id,
        store.assistants[0].id,
      ]);
    }
  });

  it('reuses an already imported assistant and preserves local edits without the catalog', () => {
    addAssistant({ ...assistant, title: 'Edited Assistant', systemPrompt: 'Local prompt.' });
    const localAssistant = { ...store.assistants[0] };

    addPreset(preset, []);

    expect(store.assistants).toEqual([localAssistant]);
    expect(store.presets[0].chats[0].assistantId).toBe(localAssistant.id);
  });

  it('keeps exact local assistant references ahead of template matches', () => {
    const localAssistant = { ...assistant, id: 'local-assistant' };
    setStore('assistants', [
      { ...assistant, id: 'copied-assistant', templateId: localAssistant.id },
      localAssistant,
    ]);

    addPreset(
      { ...preset, chats: [{ assistantId: localAssistant.id, status: 'idle' }] },
      store.assistants,
    );

    expect(store.assistants).toHaveLength(2);
    expect(store.presets[0].chats[0].assistantId).toBe(localAssistant.id);
  });
});
