import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { reconcile } from 'solid-js/store';

// Store actions reference icons, which use Vite-only import aliases.
mock.module('~/components/icons/ui', () => ({
  IconNewSession: () => null,
  IconSquarePen: () => null,
  IconTrash: () => null,
}));

Object.defineProperty(globalThis, 'self', { value: globalThis, configurable: true });
const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([]));
const { deleteData, setStore, store } = await import('.');
const { deleteSession, sessionActions } = await import('./actions/session-actions');
const { createDefaultState } = await import('./default-state');
const { apiKeys, deleteKeys, setApiKeys } = await import('./keys');
const { imageCache } = await import('../services/image-cache');
fetchMock.mockRestore();

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const confirm = mock(() => false);
const navigate = mock(() => {});
const context = { navigate, params: { id: 'delete-session' } };

beforeEach(() => {
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { confirm } });
  confirm.mockReset();
  confirm.mockReturnValue(false);
  navigate.mockClear();
  setStore(reconcile(createDefaultState()));
  setStore('sessions', [
    {
      id: 'delete-session',
      title: 'My session',
      type: 'chat',
      created: 0,
      chats: ['delete-chat'],
    },
    { id: 'keep-session', title: 'Keep me', type: 'note', created: 0, chats: ['keep-chat'] },
  ]);
  setStore('chats', [
    {
      id: 'delete-chat',
      status: 'idle',
      messages: [
        {
          id: 'image-message',
          role: 'user',
          content: [
            { type: 'image', image: { filename: 'photo.png', storageId: '/delete-image' } },
          ],
        },
      ],
    },
    { id: 'keep-chat', status: 'idle', messages: [] },
  ]);
  setApiKeys('openai', 'saved-key');
});

afterEach(() => {
  mock.restore();
  setStore(reconcile(createDefaultState()));
  deleteKeys();
  if (originalWindow) {
    Object.defineProperty(globalThis, 'window', originalWindow);
  } else {
    Reflect.deleteProperty(globalThis, 'window');
  }
});

describe('data deletion', () => {
  it('keeps data and images when confirmation is canceled', () => {
    const clearImages = spyOn(imageCache, 'clearAll').mockResolvedValue(undefined);
    const before = JSON.stringify(store);

    expect(deleteData()).toBe(false);

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(confirm).toHaveBeenCalledWith(expect.stringContaining('cannot be undone'));
    expect(JSON.stringify(store)).toBe(before);
    expect(clearImages).not.toHaveBeenCalled();
    expect(apiKeys.openai).toBe('saved-key');
  });

  it('resets data and clears images only after confirmation, keeping API keys', () => {
    const clearImages = spyOn(imageCache, 'clearAll').mockResolvedValue(undefined);
    confirm.mockReturnValue(true);

    expect(deleteData()).toBe(true);

    expect(store.sessions.some((session) => session.id === 'delete-session')).toBe(false);
    expect(store.chats.some((chat) => chat.id === 'delete-chat')).toBe(false);
    expect(clearImages).toHaveBeenCalledTimes(1);
    expect(apiKeys.openai).toBe('saved-key');
  });
});

describe('session deletion', () => {
  it.each([undefined, { sessionId: 'delete-session' }])(
    'keeps the session, messages, images, and route when confirmation is canceled (%j)',
    (options) => {
      const removeImage = spyOn(imageCache, 'remove').mockResolvedValue(undefined);
      const controller = new AbortController();
      setStore('chats', 0, { status: 'loading', controller });
      const before = JSON.stringify(store);

      sessionActions.deleteSession.fn(context, options);

      expect(confirm).toHaveBeenCalledWith(expect.stringContaining('My session'));
      expect(JSON.stringify(store)).toBe(before);
      expect(removeImage).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
      expect(controller.signal.aborted).toBe(false);
    },
  );

  it.each([undefined, { sessionId: 'delete-session' }])(
    'deletes only the confirmed active session and its images before navigating (%j)',
    (options) => {
      const removeImage = spyOn(imageCache, 'remove').mockResolvedValue(undefined);
      confirm.mockReturnValue(true);

      sessionActions.deleteSession.fn(context, options);

      expect(store.sessions.map((session) => session.id)).toEqual(['keep-session']);
      expect(store.chats.map((chat) => chat.id)).toEqual(['keep-chat']);
      expect(removeImage).toHaveBeenCalledTimes(1);
      expect(removeImage).toHaveBeenCalledWith('/delete-image');
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith('/');
    },
  );

  it.each([{ id: 'keep-session' }, {}])(
    'keeps the current route when deleting a different session (%j)',
    (params) => {
      const removeImage = spyOn(imageCache, 'remove').mockResolvedValue(undefined);
      confirm.mockReturnValue(true);

      sessionActions.deleteSession.fn({ navigate, params }, { sessionId: 'delete-session' });

      expect(store.sessions.map((session) => session.id)).toEqual(['keep-session']);
      expect(store.chats.map((chat) => chat.id)).toEqual(['keep-chat']);
      expect(removeImage).toHaveBeenCalledWith('/delete-image');
      expect(navigate).not.toHaveBeenCalled();
    },
  );

  it('aborts all requests in the deleted session before removing its chats', () => {
    spyOn(imageCache, 'remove').mockResolvedValue(undefined);
    confirm.mockReturnValue(true);
    const controllers = [new AbortController(), new AbortController()];
    const keepController = new AbortController();
    setStore('chats', 0, { status: 'loading', controller: controllers[0] });
    setStore('chats', 1, { status: 'loading', controller: keepController });
    setStore('chats', 2, {
      id: 'second-chat',
      status: 'loading',
      messages: [],
      controller: controllers[1],
    });
    setStore('chats', 3, { id: 'idle-chat', status: 'idle', messages: [] });
    setStore('sessions', 0, 'chats', [
      'delete-chat',
      'second-chat',
      'idle-chat',
      'missing-chat',
    ]);
    for (const controller of controllers) {
      controller.signal.addEventListener('abort', () => {
        expect(store.sessions.some((session) => session.id === 'delete-session')).toBe(true);
        expect(store.chats.some((chat) => chat.controller === controller)).toBe(true);
      });
    }

    expect(deleteSession('delete-session')).toBe(true);

    expect(controllers.every((controller) => controller.signal.aborted)).toBe(true);
    expect(keepController.signal.aborted).toBe(false);
    expect(store.sessions.map((session) => session.id)).toEqual(['keep-session']);
    expect(store.chats.map((chat) => chat.id)).toEqual(['keep-chat']);
  });

  it('does not prompt or navigate for a missing session', () => {
    expect(deleteSession('missing')).toBe(false);
    sessionActions.deleteSession.fn({ navigate, params: {} });
    sessionActions.deleteSession.fn(context, { sessionId: 'missing' });

    expect(confirm).not.toHaveBeenCalled();
    expect(navigate).not.toHaveBeenCalled();
  });
});
