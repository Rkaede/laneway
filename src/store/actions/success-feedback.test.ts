import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';

import * as notifications from '~/components/ui/notify';

Object.defineProperty(globalThis, 'self', { value: globalThis, configurable: true });
const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([]));
const { setStore, store } = await import('..');
const { deleteSession, renameSession } = await import('./session-actions');
const { imageCache } = await import('../../services/image-cache');
fetchMock.mockRestore();

const originalSessions = [...store.sessions];
const originalChats = [...store.chats];
const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
const confirm = mock(() => true);

beforeEach(() => {
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { confirm } });
  confirm.mockReset();
  confirm.mockReturnValue(true);
  spyOn(notifications, 'showSuccess').mockImplementation(() => {});
  spyOn(imageCache, 'remove').mockResolvedValue(undefined);
});

afterEach(() => {
  mock.restore();
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else Reflect.deleteProperty(globalThis, 'window');
  setStore('sessions', originalSessions);
  setStore('chats', originalChats);
});

describe('rename feedback', () => {
  it.each(['chat', 'note'] as const)('confirms a renamed %s', (type) => {
    setStore('sessions', [{ id: 'session', type, title: 'Old title', chats: [], created: 0 }]);

    expect(renameSession('session', 'New title')).toBe(true);

    expect(notifications.showSuccess).toHaveBeenCalledTimes(1);
    expect(notifications.showSuccess).toHaveBeenCalledWith(
      type === 'note' ? 'Note renamed.' : 'Chat renamed.',
    );
  });

  it('does not report success for a missing session or a blank title', () => {
    setStore('sessions', [
      { id: 'session', type: 'chat', title: 'Old', chats: [], created: 0 },
    ]);

    expect(renameSession('missing', 'New title')).toBe(false);
    expect(renameSession('session', '   ')).toBe(false);

    expect(notifications.showSuccess).not.toHaveBeenCalled();
  });
});

describe('delete feedback', () => {
  it.each(['chat', 'note'] as const)('confirms a deleted %s', (type) => {
    setStore('sessions', [{ id: 'session', type, title: 'Doomed', chats: [], created: 0 }]);

    expect(deleteSession('session')).toBe(true);

    expect(notifications.showSuccess).toHaveBeenCalledWith(
      type === 'note' ? 'Note deleted.' : 'Chat deleted.',
    );
  });

  it('stays silent when the deletion is canceled', () => {
    setStore('sessions', [
      { id: 'session', type: 'chat', title: 'Kept', chats: [], created: 0 },
    ]);
    confirm.mockReturnValue(false);

    expect(deleteSession('session')).toBe(false);

    expect(notifications.showSuccess).not.toHaveBeenCalled();
    expect(store.sessions.map((session) => session.id)).toEqual(['session']);
  });
});
