import { afterEach, expect, it, spyOn } from 'bun:test';
import { reconcile } from 'solid-js/store';

Object.defineProperty(globalThis, 'self', { value: globalThis, configurable: true });
const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([]));
const { apiKeys, deleteKeys, setApiKeys } = await import('./keys');
const { anyKeysSet } = await import('./selectors');
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
