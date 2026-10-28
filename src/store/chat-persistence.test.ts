import { describe, expect, it } from 'bun:test';

import { assistants } from '../../scripts/data/assistants';
import { deserializeChatStore, serializeChatStore } from './chat-persistence';
import { createDefaultState, defaults } from './default-state';

describe('chat persistence', () => {
  it('omits controllers without changing a running request in memory', () => {
    const state = createDefaultState();
    const controller = new AbortController();
    state.chats[0].controller = controller;
    state.chats[0].status = 'loading';
    state.draftChats[0].controller = controller;

    const saved = JSON.parse(serializeChatStore(state));

    expect(saved.chats[0]).not.toHaveProperty('controller');
    expect(saved.draftChats[0]).not.toHaveProperty('controller');
    expect(state.chats[0].controller).toBe(controller);
    expect(state.chats[0].status).toBe('loading');
    expect(controller.signal.aborted).toBe(false);
  });

  it('recovers legacy loading chats and drafts without losing messages or partial text', () => {
    const state = createDefaultState();
    for (const chat of [state.chats[0], state.draftChats[0]]) {
      chat.controller = new AbortController();
      chat.status = 'loading';
      chat.latest = { id: 'partial', role: 'assistant', content: 'Partial response' };
    }

    const restored = deserializeChatStore(JSON.stringify(state));

    for (const chat of [restored.chats[0], restored.draftChats[0]]) {
      expect(chat.controller).toBeUndefined();
      expect(chat.status).toBe('canceled');
      expect(chat.latest?.content).toBe('Partial response');
    }
    expect(restored.chats[0].messages).toEqual(state.chats[0].messages);
    expect(restored.sessions).toEqual(state.sessions);
    expect(restored.settings).toEqual(state.settings);
  });

  it('recovers loading chats saved without controllers', () => {
    const state = createDefaultState();
    state.chats[0].status = 'loading';

    const restored = deserializeChatStore(serializeChatStore(state));

    expect(restored.chats[0].status).toBe('canceled');
    expect(restored.chats[0].controller).toBeUndefined();
  });

  it.each(['idle', 'error', 'canceled'] as const)(
    'preserves %s chats while removing stale controllers',
    (status) => {
      const state = createDefaultState();
      state.chats[0].status = status;
      state.chats[0].controller = new AbortController();
      state.chats[0].error = { name: 'Error', message: 'Previous error' };

      const restored = deserializeChatStore(JSON.stringify(state));

      expect(restored.chats[0].status).toBe(status);
      expect(restored.chats[0].controller).toBeUndefined();
      expect(restored.chats[0].error).toEqual(state.chats[0].error);
    },
  );

  it.each(['assistant', 'preset'] as const)(
    'recovers references left behind by earlier %s deletions',
    (type) => {
      const state = createDefaultState();
      state.settings.defaultSession = { type, id: 'deleted' };
      state.settings.noteModel = { type: 'assistant', referenceId: 'deleted' };
      state.chats[0].assistantId = 'deleted';
      state.chats[0].modelId = 'saved-model';
      state.draftChats[0].assistantId = 'deleted';
      delete state.draftChats[0].modelId;
      state.presets[0].chats = [
        { assistantId: 'deleted', status: 'idle' },
        { modelId: 'deleted', status: 'idle' },
        { assistantId: 'kept', status: 'idle' },
      ];
      state.assistants = [{ id: 'kept', title: 'Kept assistant', modelId: 'kept-model' }];

      const restored = deserializeChatStore(serializeChatStore(state));

      expect(restored.settings.defaultSession).toEqual(defaults.settings.defaultSession);
      expect(restored.settings.noteModel).toEqual(defaults.settings.noteModel);
      expect(restored.chats[0].assistantId).toBeUndefined();
      expect(restored.chats[0].modelId).toBe('saved-model');
      expect(restored.chats[0].messages).toEqual(state.chats[0].messages);
      expect(restored.draftChats[0].assistantId).toBeUndefined();
      expect(restored.draftChats[0].modelId).toBe(defaults.settings.defaultSession.id);
      expect(restored.presets[0].chats).toEqual([
        { modelId: defaults.settings.defaultSession.id, status: 'idle' },
        { modelId: 'deleted', status: 'idle' },
        { assistantId: 'kept', status: 'idle' },
      ]);
      expect(restored.sessions).toEqual(state.sessions);
      expect(deserializeChatStore(serializeChatStore(restored))).toEqual(restored);
    },
  );

  it.each([
    ['concise-responses-gpt-4o', 'concise-responses'],
    ['flashcards-gpt-4o', 'flashcards'],
  ])(
    'migrates the %s template link without changing saved assistants or references',
    (oldId, newId) => {
      const state = createDefaultState();
      const assistantId = 'saved-assistant';
      state.assistants = [
        {
          id: assistantId,
          templateId: oldId,
          title: 'Custom title',
          modelId: 'openai/gpt-4o',
          systemPrompt: 'Custom prompt',
        },
      ];
      state.chats[0].assistantId = assistantId;
      state.draftChats[0].assistantId = assistantId;
      state.presets[0].chats = [{ assistantId, status: 'idle' }];
      state.speedDial = [{ id: 'assistant-dial', type: 'assistant', referenceId: assistantId }];
      state.settings.defaultSession = { type: 'assistant', id: assistantId };
      state.settings.noteModel = { type: 'assistant', referenceId: assistantId };

      const restored = deserializeChatStore(serializeChatStore(state));

      expect(restored).toEqual({
        ...state,
        assistants: [{ ...state.assistants[0], templateId: newId }],
      });
      expect(assistants.find((assistant) => assistant.id === newId)?.templateId).toBe(newId);
      expect(assistants.some((assistant) => assistant.id === oldId)).toBe(false);
      expect(deserializeChatStore(serializeChatStore(restored))).toEqual(restored);
    },
  );

  it.each([undefined, 'custom-template', 'concise-responses', 'flashcards'])(
    'preserves the %s template link',
    (templateId) => {
      const state = createDefaultState();
      state.assistants = [
        {
          id: 'saved-assistant',
          title: 'Saved assistant',
          modelId: 'custom-model',
          templateId,
        },
      ];

      expect(deserializeChatStore(serializeChatStore(state))).toEqual(state);
    },
  );
});
