import { afterEach, expect, it } from 'bun:test';

import { apiKeys, deleteKeys, setApiKey, setApiKeys } from './keys';

afterEach(deleteKeys);

it.each(['openai', 'openrouter'] as const)(
  'trims a %s key as soon as it is entered',
  (provider) => {
    setApiKey(provider, ' \t sk-test-key \n');

    expect(apiKeys[provider]).toBe('sk-test-key');
  },
);

it.each(['openai', 'openrouter'] as const)(
  'clears a %s key for empty or whitespace-only input',
  (provider) => {
    for (const value of ['', ' \t\n ']) {
      setApiKey(provider, 'existing-key');

      setApiKey(provider, value);

      expect(apiKeys[provider]).toBe('');
    }
  },
);

it.each(['openai', 'openrouter'] as const)(
  'updates only the %s key and preserves welcome completion',
  (provider) => {
    const otherProvider = provider === 'openai' ? 'openrouter' : 'openai';
    setApiKeys(otherProvider, 'other-key');
    setApiKeys('hasCompletedWelcome', true);

    setApiKey(provider, 'new-key');

    expect(apiKeys[provider]).toBe('new-key');
    expect(apiKeys[otherProvider]).toBe('other-key');
    expect(apiKeys.hasCompletedWelcome).toBe(true);
  },
);
