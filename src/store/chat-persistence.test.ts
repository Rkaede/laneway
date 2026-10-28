import { describe, expect, it } from 'bun:test';

import { deserializeChatStore, serializeChatStore } from './chat-persistence';
import { createDefaultState } from './default-state';

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
});
