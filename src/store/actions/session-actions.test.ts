import { beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';

import type { MessageProps } from '~/types';

// Store actions reference icons, which use Vite-only import aliases.
mock.module('~/components/icons/ui', () => ({
  IconNewSession: () => null,
  IconTrash: () => null,
}));

Object.defineProperty(globalThis, 'self', { value: globalThis, configurable: true });
const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([]));
const { setStore, store } = await import('..');
const { setModels } = await import('../models');
const { addMessageToSessionChats } = await import('./session-actions');
fetchMock.mockRestore();

const imageMessage: MessageProps = {
  id: 'image-message',
  role: 'user',
  content: [
    { type: 'image', image: { filename: 'photo.png', storageId: 'photo' } },
    { type: 'text', text: 'What is in this picture?' },
  ],
};

beforeEach(() => {
  setModels(
    [true, false].map((vision) => ({
      id: vision ? 'vision' : 'no-vision',
      title: vision ? 'Vision Model' : 'No Vision Model',
      creator: { id: 'c', name: 'c', website: '', icon: '' },
      created: 0,
      provider: [],
      vision,
    })),
  );
  setStore('assistants', [
    { id: 'assistant-vision', title: 'Vision Assistant', modelId: 'vision' },
    { id: 'assistant-no-vision', title: 'No Vision Assistant', modelId: 'no-vision' },
  ]);
  setStore('sessions', [
    { id: 'session', title: 'Assistant chat', type: 'chat', created: 0, chats: ['chat'] },
  ]);
  setStore('chats', [
    { id: 'chat', assistantId: 'assistant-vision', status: 'idle', messages: [] },
  ]);
});

describe('addMessageToSessionChats', () => {
  it('leaves example messages and request state unchanged', () => {
    const message: MessageProps = { id: 'example', role: 'assistant', content: 'Example' };
    const error = { name: 'Error', message: 'Previous error' };
    setStore('sessions', 0, 'created', -1);
    setStore('chats', 0, { messages: [message], status: 'error', error });

    const sessionId = addMessageToSessionChats(imageMessage, 'session');
    addMessageToSessionChats({ id: 'text', role: 'user', content: 'Hello' }, 'session');

    expect(sessionId).toBe('session');
    expect(store.chats[0].messages).toEqual([message]);
    expect(store.chats[0].status).toBe('error');
    expect(store.chats[0].error).toEqual(error);
  });

  it('adds image messages to a vision assistant chat', () => {
    addMessageToSessionChats(imageMessage, 'session');

    expect(store.chats[0].messages).toEqual([imageMessage]);
  });

  it('keeps image messages when creating a session from an assistant draft', () => {
    setStore('draftSession', {
      id: 'draft',
      title: 'Assistant draft',
      type: 'chat',
      created: 0,
      chats: ['draft-chat'],
    });
    setStore('draftChats', [
      { id: 'draft-chat', assistantId: 'assistant-vision', status: 'idle', messages: [] },
    ]);

    const sessionId = addMessageToSessionChats(imageMessage);
    const session = store.sessions.find((s) => s.id === sessionId);
    const chat = store.chats.find((c) => c.id === session?.chats[0]);

    expect(chat?.assistantId).toBe('assistant-vision');
    expect(chat?.modelId).toBeUndefined();
    expect(chat?.messages).toEqual([imageMessage]);
  });

  it('checks the assistant model before a model stored on the chat', () => {
    setStore('chats', 0, 'modelId', 'no-vision');

    addMessageToSessionChats(imageMessage, 'session');

    expect(store.chats[0].messages).toEqual([imageMessage]);
  });

  it('adds images only to vision-capable chats in a mixed session', () => {
    setStore('sessions', 0, 'chats', ['chat', 'model-chat', 'no-vision-chat']);
    setStore('chats', 1, { id: 'model-chat', modelId: 'vision', status: 'idle', messages: [] });
    setStore('chats', 2, {
      id: 'no-vision-chat',
      assistantId: 'assistant-no-vision',
      modelId: 'vision',
      status: 'idle',
      messages: [],
    });

    addMessageToSessionChats(imageMessage, 'session');

    expect(store.chats.map((c) => c.messages)).toEqual([[imageMessage], [imageMessage], []]);
  });

  it('still adds text messages to a non-vision assistant chat', () => {
    setStore('chats', 0, 'assistantId', 'assistant-no-vision');
    const message: MessageProps = { id: 'text-message', role: 'user', content: 'Hello' };

    addMessageToSessionChats(message, 'session');

    expect(store.chats[0].messages).toEqual([message]);
  });
});
