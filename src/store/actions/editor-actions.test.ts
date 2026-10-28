import { afterEach, beforeEach, expect, it } from 'bun:test';

import type { AssistantProps, PresetProps } from '~/types';

Object.defineProperty(globalThis, 'self', { value: globalThis, configurable: true });
const { setStore, store } = await import('..');
const { addAssistant } = await import('./assistants');
const { addPreset, setPresetName } = await import('./presets');

const originalAssistants = [...store.assistants];
const originalPresets = [...store.presets];
const assistant: AssistantProps = {
  id: 'assistant-template',
  title: 'Shared Assistant',
  modelId: 'openai/gpt-4o',
};
const preset: PresetProps = {
  id: 'preset-template',
  presetTitle: 'Shared Preset',
  type: 'chat',
  chats: [{ assistantId: assistant.id, status: 'idle' }],
};

beforeEach(() => {
  setStore('assistants', [{ ...assistant, id: 'existing-assistant' }]);
  setStore('presets', [{ ...preset, id: 'existing-preset' }]);
});

afterEach(() => {
  setStore('assistants', originalAssistants);
  setStore('presets', originalPresets);
});

it.each([assistant, { ...assistant, title: '   ', modelId: '' }])(
  'adds assistants without applying editor validation (%j)',
  (input) => {
    const id = addAssistant(input);

    expect(typeof id).toBe('string');
    expect(store.assistants).toHaveLength(2);
    expect(store.assistants[1]).toMatchObject({
      id,
      title: input.title,
      modelId: input.modelId,
      templateId: input.id,
    });
  },
);

it.each([preset, { ...preset, presetTitle: undefined }])(
  'returns the new preset ID and copies required assistants despite duplicate names (%j)',
  (input) => {
    const id = addPreset(input, [assistant]);

    expect(typeof id).toBe('string');
    expect(store.presets).toHaveLength(2);
    expect(store.presets[1]).toMatchObject({ id, templateId: input.id });
    expect(store.presets[1].presetTitle).toBe(input.presetTitle);
    expect(store.assistants).toHaveLength(2);
    expect(store.assistants[1]).toMatchObject({
      templateId: assistant.id,
      title: assistant.title,
    });
  },
);

it.each(['', ' Shared Preset '])('sets the preset name as supplied (%j)', (name) => {
  setStore('presets', (presets) => [...presets, { ...preset, id: 'other-preset' }]);

  setPresetName('other-preset', name);

  expect(store.presets[1].presetTitle).toBe(name);
});
