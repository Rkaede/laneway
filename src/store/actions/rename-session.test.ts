import { afterEach, beforeEach, expect, it, mock, spyOn } from 'bun:test';

mock.module('~/components/icons/ui', () => ({
  IconNewSession: () => null,
  IconTrash: () => null,
}));

Object.defineProperty(globalThis, 'self', { value: globalThis, configurable: true });
const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([]));
const { setStore, store } = await import('..');
const { renameSession } = await import('./session-actions');
fetchMock.mockRestore();

const originalSessions = [...store.sessions];

beforeEach(() => {
  setStore('sessions', [
    { id: 'saved-session', title: 'Saved chat', type: 'chat', chats: [], created: 0 },
  ]);
});

afterEach(() => {
  setStore('sessions', originalSessions);
});

it.each(['', '   ', '\t\n', '\u00a0'])('rejects blank session titles (%j)', (title) => {
  expect(renameSession('saved-session', title)).toBe(false);
  expect(store.sessions[0].title).toBe('Saved chat');
});

it('trims the title and renames only the requested session', () => {
  setStore('sessions', 1, {
    id: 'other-session',
    title: 'Other chat',
    type: 'chat',
    chats: [],
    created: 0,
  });

  expect(renameSession('saved-session', '  My custom title \n')).toBe(true);
  expect(store.sessions[0].title).toBe('My custom title');
  expect(store.sessions[1].title).toBe('Other chat');
});

it('does not rename a session that no longer exists', () => {
  expect(renameSession('missing-session', 'New title')).toBe(false);
  expect(store.sessions[0].title).toBe('Saved chat');
});
