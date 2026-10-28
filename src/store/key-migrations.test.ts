import { expect, it } from 'bun:test';

import { removeLegacyGoogleKey } from './key-migrations';

it.each(['legacy-key', '', null, undefined])(
  'removes a legacy Google field with value %p without changing supported keys',
  (google) => {
    const keys = {
      openai: 'openai-key',
      openrouter: 'openrouter-key',
      hasCompletedWelcome: true,
      google,
    };

    const migrated = removeLegacyGoogleKey(keys);

    expect(migrated).toEqual({
      openai: 'openai-key',
      openrouter: 'openrouter-key',
      hasCompletedWelcome: true,
    });
    expect(migrated).not.toHaveProperty('google');
    expect(JSON.parse(JSON.stringify(migrated))).not.toHaveProperty('google');
    expect(keys).toHaveProperty('google', google);
    expect(removeLegacyGoogleKey(migrated)).toEqual(migrated);
  },
);

it('preserves keys that have already been migrated', () => {
  const keys = { openai: 'openai-key', hasCompletedWelcome: false };

  expect(removeLegacyGoogleKey(keys)).toEqual(keys);
});
