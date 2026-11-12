import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { reconcile } from 'solid-js/store';

Object.defineProperty(globalThis, 'self', { value: globalThis, configurable: true });
const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([]));
const { setStore, store } = await import('..');
const { deleteSession, forkSession } = await import('./session-actions');
const { createDefaultState } = await import('../default-state');
const { imageCache } = await import('../../services/image-cache');
fetchMock.mockRestore();

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const confirm = mock(() => true);

beforeEach(() => {
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { confirm } });
  setStore(reconcile(createDefaultState()));
  setStore('sessions', [
    { id: 'parent', title: 'Parent', type: 'chat', created: 1, chats: ['left', 'right'] },
    { id: 'note', title: 'Note', type: 'note', created: 1, chats: ['note-chat'] },
  ]);
  setStore('chats', [
    {
      id: 'left',
      sessionId: 'parent',
      status: 'idle',
      modelId: 'model-a',
      messages: [
        {
          id: 'u1',
          role: 'user',
          content: [
            { type: 'text', text: 'Describe' },
            { type: 'image', image: { filename: 'p.png', storageId: 'shared-image' } },
          ],
        },
        { id: 'a1', role: 'assistant', content: 'Left answer' },
      ],
    },
    {
      id: 'right',
      sessionId: 'parent',
      status: 'idle',
      modelId: 'model-b',
      messages: [
        { id: 'u1', role: 'user', content: 'Describe' },
        { id: 'a2', role: 'assistant', content: 'Right answer' },
      ],
    },
    {
      id: 'note-chat',
      sessionId: 'note',
      status: 'idle',
      messages: [{ id: 'n1', role: 'assistant', content: 'Note' }],
    },
  ]);
});

afterEach(() => {
  mock.restore();
  setStore(reconcile(createDefaultState()));
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else Reflect.deleteProperty(globalThis, 'window');
});

describe('forkSession', () => {
  it('forks only the chosen chat of a multi-chat session into a new first session', () => {
    const id = forkSession({
      sessionId: 'parent',
      chatId: 'right',
      messageId: 'a2',
      title: 'Right branch',
    });

    expect(id).toBeDefined();
    expect(store.sessions[0].id).toBe(id!);
    expect(store.sessions[0].title).toBe('Right branch');
    expect(store.sessions[0].branch?.parentId).toBe('parent');
    expect(store.sessions[0].chats).toHaveLength(1);
    const fork = store.chats.find((c) => c.id === store.sessions[0].chats[0]);
    expect(fork?.modelId).toBe('model-b');
    expect(fork?.messages.map((m) => m.content)).toEqual(['Describe', 'Right answer']);
    // The parent is untouched.
    expect(store.sessions[1].chats).toEqual(['left', 'right']);
    expect(store.chats.find((c) => c.id === 'right')?.messages).toHaveLength(2);
  });

  it('refuses notes, unknown chats and unknown messages', () => {
    expect(forkSession({ sessionId: 'note', chatId: 'note-chat', messageId: 'n1' })).toBe(
      undefined,
    );
    expect(forkSession({ sessionId: 'parent', chatId: 'nope', messageId: 'a1' })).toBe(
      undefined,
    );
    expect(forkSession({ sessionId: 'parent', chatId: 'left', messageId: 'nope' })).toBe(
      undefined,
    );
    expect(store.sessions).toHaveLength(2);
  });
});

describe('deleting a parent or a fork', () => {
  it('keeps a fork readable and keeps shared images when the parent is deleted', () => {
    const remove = spyOn(imageCache, 'remove').mockResolvedValue(undefined);
    const id = forkSession({ sessionId: 'parent', chatId: 'left', messageId: 'a1' });

    expect(deleteSession('parent')).toBe(true);

    const fork = store.sessions.find((s) => s.id === id);
    const chat = store.chats.find((c) => c.id === fork?.chats[0]);
    expect(fork?.branch).toEqual({
      parentId: 'parent',
      parentTitle: 'Parent',
      messageId: 'a1',
      forkedMessageId: chat?.messages.at(-1)?.id ?? '',
    });
    expect(remove).not.toHaveBeenCalled();
    expect(chat?.messages).toHaveLength(2);
  });

  it('removes the shared image once the last copy is deleted', () => {
    const remove = spyOn(imageCache, 'remove').mockResolvedValue(undefined);
    const id = forkSession({ sessionId: 'parent', chatId: 'left', messageId: 'a1' });

    deleteSession('parent');
    deleteSession(id!);

    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith('shared-image');
  });

  it('keeps the parent and its images when a fork is deleted', () => {
    const remove = spyOn(imageCache, 'remove').mockResolvedValue(undefined);
    const id = forkSession({ sessionId: 'parent', chatId: 'left', messageId: 'a1' });

    deleteSession(id!);

    expect(remove).not.toHaveBeenCalled();
    expect(store.sessions.some((s) => s.id === 'parent')).toBe(true);
  });
});
