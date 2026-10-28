import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { reconcile } from 'solid-js/store';

import type { AssistantProps, SessionTemplate } from '~/types';

Object.defineProperty(globalThis, 'self', { value: globalThis, configurable: true });
const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([]));
const { setStore, store } = await import('..');
const { createDefaultState, defaults } = await import('../default-state');
const { models, setModels } = await import('../models');
const { deleteAssistant } = await import('./assistants');
const { deletePreset } = await import('./presets');
const { newDraftSession, sessionActions } = await import('./session-actions');
fetchMock.mockRestore();

const originalModels = [...models];
const assistant: AssistantProps = {
  id: 'assistant',
  title: 'Assistant',
  modelId: 'assistant-model',
};

beforeEach(() => {
  setStore(reconcile(createDefaultState()));
  setModels(
    [assistant.modelId, defaults.settings.defaultSession.id].map((id) => ({
      id,
      title: id,
      creator: { id: 'creator', name: 'Creator', website: '', icon: '' },
      created: 0,
      provider: [],
    })),
  );
  setStore('assistants', [assistant, { ...assistant, id: 'other-assistant' }]);
  setStore('presets', [
    {
      id: 'preset',
      presetTitle: 'Preset',
      type: 'chat',
      chats: [
        { assistantId: assistant.id, modelId: 'old-model', status: 'idle' },
        { assistantId: 'other-assistant', status: 'idle' },
        { modelId: assistant.id, status: 'idle' },
      ],
    },
    {
      id: 'other-preset',
      type: 'chat',
      chats: [{ assistantId: assistant.id, status: 'idle' }],
    },
  ]);
  setStore('speedDial', [
    { id: 'assistant-dial', type: 'assistant', referenceId: assistant.id },
    { id: 'preset-dial', type: 'preset', referenceId: 'preset' },
    { id: 'model-dial', type: 'model', referenceId: assistant.id },
  ]);
});

afterEach(() => {
  setStore(reconcile(createDefaultState()));
  setModels(originalModels);
});

describe('deleteAssistant', () => {
  it('keeps new chats and notes working when their default assistant is deleted', () => {
    setStore('settings', 'defaultSession', { type: 'assistant', id: assistant.id });
    setStore('settings', 'noteModel', { type: 'assistant', referenceId: assistant.id });

    deleteAssistant(assistant.id);

    expect(store.assistants.map((a) => a.id)).toEqual(['other-assistant']);
    expect(store.settings.defaultSession).toEqual({ type: 'model', id: assistant.modelId });
    expect(store.settings.noteModel).toEqual({
      type: 'model',
      referenceId: assistant.modelId,
    });
    expect(store.speedDial.map((item) => item.id)).toEqual(['preset-dial', 'model-dial']);

    const context = { navigate: mock(() => {}), params: {} };
    sessionActions.newSession.fn(context);
    expect(store.draftSession.type).toBe('chat');
    expect(store.draftChats[0].modelId).toBe(assistant.modelId);
    expect(store.draftChats[0].assistantId).toBeUndefined();

    sessionActions.newNote.fn(context);
    expect(store.draftSession.type).toBe('note');
    expect(store.draftChats[0].modelId).toBe(assistant.modelId);
    expect(store.draftChats[0].assistantId).toBeUndefined();
  });

  it('keeps preset slots, saved messages and drafts using the deleted assistant model', () => {
    const messages = [{ id: 'message', role: 'user' as const, content: 'Saved message' }];
    const chat = { id: 'chat', assistantId: assistant.id, status: 'idle' as const, messages };
    setStore('chats', [chat, { ...chat, id: 'other-chat', assistantId: 'other-assistant' }]);
    setStore('draftChats', [{ ...chat, id: 'draft-chat' }]);
    setStore('draftSession', 'input', 'Unsent input');

    deleteAssistant(assistant.id);

    expect(store.presets[0].chats).toEqual([
      { modelId: assistant.modelId, status: 'idle' },
      { assistantId: 'other-assistant', status: 'idle' },
      { modelId: assistant.id, status: 'idle' },
    ]);
    expect(store.presets[1].chats).toEqual([{ modelId: assistant.modelId, status: 'idle' }]);
    expect(store.chats[0]).toEqual({
      id: 'chat',
      modelId: assistant.modelId,
      status: 'idle',
      messages,
    });
    expect(store.chats[1].assistantId).toBe('other-assistant');
    expect(store.draftChats[0].assistantId).toBeUndefined();
    expect(store.draftChats[0].modelId).toBe(assistant.modelId);
    expect(store.draftChats[0].messages).toEqual(messages);
    expect(store.draftSession.input).toBe('Unsent input');

    newDraftSession({ type: 'preset', referenceId: 'preset' });
    expect(store.draftChats.map((c) => c.assistantId)).toEqual([
      undefined,
      'other-assistant',
      undefined,
    ]);
    expect(store.draftChats[0].modelId).toBe(assistant.modelId);
  });

  it.each(['model', 'preset', 'assistant'] as const)(
    'preserves unrelated %s defaults and note selections',
    (type) => {
      const selection: SessionTemplate = {
        type,
        id: type === 'assistant' ? 'other-assistant' : assistant.id,
      };
      setStore('settings', 'defaultSession', selection);
      const noteModel = { type: 'model' as const, referenceId: assistant.id };
      setStore('settings', 'noteModel', noteModel);

      deleteAssistant(assistant.id);

      expect(store.settings.defaultSession).toEqual(selection);
      expect(store.settings.noteModel).toEqual(noteModel);
    },
  );
});

describe('deletePreset', () => {
  it('restores a working model default after deleting the default preset', () => {
    setStore('settings', 'defaultSession', { type: 'preset', id: 'preset' });
    const context = { navigate: mock(() => {}), params: {} };
    sessionActions.newSession.fn(context);
    const draftId = store.draftSession.id;

    deletePreset('preset');

    expect(store.presets.map((p) => p.id)).toEqual(['other-preset']);
    expect(store.settings.defaultSession).toEqual(defaults.settings.defaultSession);
    expect(store.speedDial.map((item) => item.id)).toEqual(['assistant-dial', 'model-dial']);

    sessionActions.newSession.fn(context);
    expect(store.draftSession.id).not.toBe(draftId);
    expect(store.draftChats).toHaveLength(1);
    expect(store.draftChats[0].modelId).toBe(defaults.settings.defaultSession.id);
  });

  it.each(['model', 'assistant', 'preset'] as const)(
    'preserves unrelated %s defaults, notes and existing chats',
    (type) => {
      const selection: SessionTemplate = {
        type,
        id: type === 'preset' ? 'other-preset' : 'preset',
      };
      setStore('settings', 'defaultSession', selection);
      const before = JSON.parse(JSON.stringify(store));

      deletePreset('preset');

      expect(store.settings.defaultSession).toEqual(selection);
      expect(store.settings.noteModel).toEqual(before.settings.noteModel);
      expect(store.sessions).toEqual(before.sessions);
      expect(store.chats).toEqual(before.chats);
      expect(store.draftSession).toEqual(before.draftSession);
      expect(store.draftChats).toEqual(before.draftChats);
    },
  );
});
