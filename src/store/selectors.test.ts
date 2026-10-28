import { afterEach, describe, expect, it, spyOn } from 'bun:test';
import { reconcile } from 'solid-js/store';

Object.defineProperty(globalThis, 'self', { value: globalThis, configurable: true });
const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([]));
const { apiKeys, deleteKeys, setApiKeys } = await import('./keys');
const { setStore, store } = await import('.');
const { anyKeysSet, selectRouteSession } = await import('./selectors');
fetchMock.mockRestore();

afterEach(() => {
  setApiKeys(reconcile({ openai: '', openrouter: '', hasCompletedWelcome: false }));
});

it('does not accept a legacy Google key as a usable key', () => {
  const legacyKeys = { openai: '', openrouter: '', google: 'legacy-key' };
  setApiKeys(legacyKeys);

  expect(apiKeys).toHaveProperty('google', 'legacy-key');
  expect(anyKeysSet()).toBe(false);
});

it('deletes supported and legacy keys instead of merging them with defaults', () => {
  const legacyKeys = {
    openai: 'openai-key',
    openrouter: 'openrouter-key',
    google: 'legacy-key',
    hasCompletedWelcome: true,
  };
  setApiKeys(legacyKeys);

  deleteKeys();

  expect(apiKeys).toEqual({ openai: '', openrouter: '', hasCompletedWelcome: false });
  expect(apiKeys).not.toHaveProperty('google');
});

it.each(['openai', 'openrouter'] as const)('accepts a %s key on its own', (provider) => {
  setApiKeys(provider, 'test-key');

  expect(anyKeysSet()).toBe(true);
});

it('requires a supported key even after welcome was completed', () => {
  setApiKeys('hasCompletedWelcome', true);

  expect(anyKeysSet()).toBe(false);
});

describe('route session selection', () => {
  const originalSessions = [...store.sessions];

  afterEach(() => {
    setStore('sessions', originalSessions);
  });

  it('uses the draft only when there is no session ID', () => {
    expect(selectRouteSession(() => undefined)()).toBe(store.draftSession);
  });

  it('selects an existing session by ID', () => {
    const session = store.sessions[0];

    expect(selectRouteSession(() => session.id)()).toBe(session);
  });

  it.each(['missing-session', 'draft'])('does not use the draft for unknown ID %s', (id) => {
    expect(selectRouteSession(() => id)()).toBeUndefined();
  });

  it('does not use the draft when returning to a deleted session', () => {
    const id = store.sessions[0].id;
    setStore('sessions', (sessions) => sessions.filter((session) => session.id !== id));

    expect(selectRouteSession(() => id)()).toBeUndefined();
  });
});
