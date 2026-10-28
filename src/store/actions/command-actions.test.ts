import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';

import type { ActionContext } from '~/types';

Object.defineProperty(globalThis, 'self', { value: globalThis, configurable: true });
const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([]));
const { setStore, store } = await import('..');
const { actions } = await import('.');
fetchMock.mockRestore();

const originalSessions = [...store.sessions];
const originalCompletions = store.featureFlags.completions;
const navigate = mock(() => {});
const context: ActionContext = { navigate, params: {} };

beforeEach(() => {
  setStore('sessions', [
    { id: 'saved-session', title: 'Saved chat', type: 'chat', chats: [], created: 0 },
  ]);
  setStore('featureFlags', 'completions', false);
});

afterEach(() => {
  setStore('sessions', originalSessions);
  setStore('featureFlags', 'completions', originalCompletions);
});

describe('command action availability', () => {
  it.each([undefined, 'missing-session', 'draft'])(
    'hides Delete Session without an existing route session (%s)',
    (id) => {
      expect(actions.deleteSession.available?.({ navigate, params: { id } })).toBe(false);
    },
  );

  it('shows Delete Session only while the route session exists', () => {
    const context = { navigate, params: { id: 'saved-session' } };

    expect(actions.deleteSession.available?.(context)).toBe(true);

    setStore('sessions', []);

    expect(actions.deleteSession.available?.(context)).toBe(false);
  });

  it('hides Latest Session when there are no saved sessions', () => {
    expect(actions.gotoLatest.available?.(context)).toBe(true);

    setStore('sessions', []);

    expect(actions.gotoLatest.available?.(context)).toBe(false);
  });

  it('shows Toggle Completions only while its feature is enabled', () => {
    expect(actions.toggleCompletions.available?.(context)).toBe(false);

    setStore('featureFlags', 'completions', true);

    expect(actions.toggleCompletions.available?.(context)).toBe(true);

    setStore('featureFlags', 'completions', false);

    expect(actions.toggleCompletions.available?.(context)).toBe(false);
  });
});
