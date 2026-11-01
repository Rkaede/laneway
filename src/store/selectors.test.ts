import { afterEach, describe, expect, it, spyOn } from 'bun:test';
import { reconcile } from 'solid-js/store';

Object.defineProperty(globalThis, 'self', { value: globalThis, configurable: true });
const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([]));
const { apiKeys, deleteKeys, setApiKeys } = await import('./keys');
const { setStore, store } = await import('.');
const { anyKeysSet, selectRouteSession } = await import('./selectors');
fetchMock.mockRestore();

afterEach(() => {
  setApiKeys(reconcile({ openrouter: '' }));
});

it.each(['google', 'openai'])('does not accept a legacy %s key as a usable key', (field) => {
  setApiKeys({ openrouter: '', [field]: 'legacy-key' });

  expect(apiKeys).toHaveProperty(field, 'legacy-key');
  expect(anyKeysSet()).toBe(false);
});

it('deletes the key and legacy fields instead of merging them with defaults', () => {
  setApiKeys({ openrouter: 'openrouter-key', openaiKeyRemoved: true });

  deleteKeys();

  expect(apiKeys).toEqual({ openrouter: '' });
});

it('accepts an OpenRouter key', () => {
  setApiKeys('openrouter', 'test-key');

  expect(anyKeysSet()).toBe(true);
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
