import { expect, it } from 'bun:test';

import { removeLegacyKeys } from './key-migrations';

it.each(['legacy-key', '', null, undefined])(
  'removes a legacy Google field with value %p without changing the OpenRouter key',
  (google) => {
    const keys = { openrouter: 'openrouter-key', google };

    const migrated = removeLegacyKeys(keys);

    expect(migrated).toEqual({ openrouter: 'openrouter-key' });
    expect(JSON.parse(JSON.stringify(migrated))).not.toHaveProperty('google');
    expect(keys).toHaveProperty('google', google);
    expect(removeLegacyKeys(migrated)).toEqual(migrated);
  },
);

it('removes an OpenAI key and the old welcome flag, and flags the removed key', () => {
  const keys = { openai: 'sk-openai', openrouter: '', hasCompletedWelcome: true };

  expect(removeLegacyKeys(keys)).toEqual({ openrouter: '', openaiKeyRemoved: true });
});

it.each(['', '  '])('does not flag an empty OpenAI key %p', (openai) => {
  expect(removeLegacyKeys({ openai, openrouter: 'key' })).toEqual({ openrouter: 'key' });
});

it('preserves keys that have already been migrated', () => {
  const keys = { openrouter: 'key', openaiKeyRemoved: true as const };

  expect(removeLegacyKeys(keys)).toEqual(keys);
});
