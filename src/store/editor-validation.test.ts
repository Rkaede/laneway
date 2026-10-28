import { describe, expect, it } from 'bun:test';

import type { AssistantProps, PresetProps } from '~/types';

import { validateAssistant, validatePreset } from './editor-validation';

const assistant: AssistantProps = {
  id: 'assistant',
  title: 'My Assistant',
  modelId: 'openai/gpt-4o',
};
const preset: PresetProps = {
  id: 'preset',
  presetTitle: 'My Preset',
  type: 'chat',
  chats: [{ modelId: assistant.modelId, status: 'idle' }],
};

describe('assistant validation', () => {
  it.each(['', '   ', '\n\t'])('rejects a blank name (%j)', (title) => {
    expect(validateAssistant({ ...assistant, title }, [])).toBe('Name is required.');
  });

  it.each(['', '   '])('requires a model (%j)', (modelId) => {
    expect(validateAssistant({ ...assistant, modelId }, [])).toBe('Select a model.');
  });

  it('rejects duplicate names, ignoring case and surrounding whitespace', () => {
    expect(validateAssistant({ ...assistant, title: ' my ASSISTANT ' }, [assistant])).toBe(
      'Name is already in use.',
    );
  });

  it('allows a unique name and model', () => {
    expect(validateAssistant(assistant, [])).toBeUndefined();
  });

  it('allows an assistant to keep its own name when editing', () => {
    expect(validateAssistant(assistant, [assistant], assistant.id)).toBeUndefined();
  });

  it('still rejects another assistant with the same name when editing', () => {
    expect(
      validateAssistant(assistant, [assistant, { ...assistant, id: 'other' }], assistant.id),
    ).toBe('Name is already in use.');
  });
});

describe('preset validation', () => {
  it.each([undefined, '', '   ', '\n\t'])('rejects a blank name (%j)', (presetTitle) => {
    expect(validatePreset({ ...preset, presetTitle }, [])).toBe('Name is required.');
  });

  it('rejects duplicate names, ignoring case and surrounding whitespace', () => {
    expect(validatePreset({ ...preset, presetTitle: ' my PRESET ' }, [preset])).toBe(
      'Name is already in use.',
    );
  });

  it('allows a unique name', () => {
    expect(validatePreset(preset, [])).toBeUndefined();
  });

  it('allows a preset to keep its own name when editing', () => {
    expect(validatePreset(preset, [preset], preset.id)).toBeUndefined();
  });

  it('still rejects another preset with the same name when editing', () => {
    expect(validatePreset(preset, [preset, { ...preset, id: 'other' }], preset.id)).toBe(
      'Name is already in use.',
    );
  });
});
