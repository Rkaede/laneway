import { afterEach, expect, it } from 'bun:test';

import { apiKeys, deleteKeys, setApiKey } from './keys';

afterEach(deleteKeys);

it('trims a key as soon as it is entered', () => {
  setApiKey(' \t sk-or-test-key \n');

  expect(apiKeys.openrouter).toBe('sk-or-test-key');
});

it('clears the key for empty or whitespace-only input', () => {
  for (const value of ['', ' \t\n ']) {
    setApiKey('existing-key');

    setApiKey(value);

    expect(apiKeys.openrouter).toBe('');
  }
});
