import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';

// Store actions reference icons, which use Vite-only import aliases.
mock.module('~/components/icons/ui', () => ({
  IconBox: () => null,
  IconFileSliders: () => null,
  IconInfo: () => null,
  IconLayoutGrid: () => null,
  IconListRestart: () => null,
  IconNewSession: () => null,
  IconPencilLine: () => null,
  IconSettings: () => null,
  IconSidebar: () => null,
  IconSun: () => null,
  IconTrash: () => null,
}));

Object.defineProperty(globalThis, 'self', {
  value: globalThis,
  configurable: true,
  writable: true,
});
const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([]));
const { setStore, store } = await import('..');
const { navigationActions } = await import('./navigation-actions');
fetchMock.mockRestore();

const originalSessions = [...store.sessions];
const navigate = mock(() => {});
const context = { navigate, params: {} };

beforeEach(() => {
  navigate.mockClear();
  setStore('sessions', []);
});

afterEach(() => {
  setStore('sessions', originalSessions);
});

describe('Latest Session', () => {
  it('navigates to the newest session without reordering the store', () => {
    setStore('sessions', [
      { id: 'oldest', title: 'Oldest', type: 'chat', created: 1, chats: [] },
      { id: 'newest', title: 'Newest', type: 'chat', created: 3, chats: [] },
      { id: 'middle', title: 'Middle', type: 'note', created: 2, chats: [] },
    ]);

    navigationActions.gotoLatest.fn(context);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/session/newest');
    expect(store.sessions.map((session) => session.id)).toEqual(['oldest', 'newest', 'middle']);
  });

  it('navigates to the only session', () => {
    setStore('sessions', [{ id: 'only', title: 'Only', type: 'chat', created: 1, chats: [] }]);

    navigationActions.gotoLatest.fn(context);

    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith('/session/only');
  });

  it('does not navigate when there are no sessions', () => {
    navigationActions.gotoLatest.fn(context);

    expect(navigate).not.toHaveBeenCalled();
  });
});
