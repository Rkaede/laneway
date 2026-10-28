import { describe, expect, it } from 'bun:test';

import { getChatModel } from './util';

const models = ['assistant-model', 'chat-model'].map((id) => ({
  id,
  title: id,
  creator: { id: 'c', name: 'c', website: '', icon: '' },
  created: 0,
  provider: [],
}));
const assistants = [{ id: 'assistant', title: 'Assistant', modelId: 'assistant-model' }];

describe('getChatModel', () => {
  it('resolves an assistant chat without a direct model ID', () => {
    expect(getChatModel({ assistantId: 'assistant' }, assistants, models)).toBe(models[0]);
  });

  it('prefers the assistant model when the chat also has a model ID', () => {
    expect(
      getChatModel({ assistantId: 'assistant', modelId: 'chat-model' }, assistants, models),
    ).toBe(models[0]);
  });

  it('resolves a direct model chat', () => {
    expect(getChatModel({ modelId: 'chat-model' }, assistants, models)).toBe(models[1]);
  });

  it('falls back to the chat model when the assistant no longer exists', () => {
    expect(
      getChatModel({ assistantId: 'deleted', modelId: 'chat-model' }, assistants, models),
    ).toBe(models[1]);
  });

  it('returns undefined when the assistant model is unavailable', () => {
    expect(
      getChatModel({ assistantId: 'assistant', modelId: 'chat-model' }, assistants, [
        models[1],
      ]),
    ).toBeUndefined();
  });

  it('returns undefined for a missing chat or unknown model', () => {
    expect(getChatModel(undefined, assistants, models)).toBeUndefined();
    expect(getChatModel({ modelId: 'unknown' }, assistants, models)).toBeUndefined();
  });
});
