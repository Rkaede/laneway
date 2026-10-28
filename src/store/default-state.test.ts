import { describe, expect, it } from 'bun:test';

import { createDefaultState } from './default-state';

describe('createDefaultState', () => {
  it('uses the default session model for the initial draft', () => {
    const state = createDefaultState();

    expect(state.settings.defaultSession.type).toBe('model');
    expect(state.draftChats.map((chat) => chat.modelId)).toEqual([
      state.settings.defaultSession.id,
    ]);
  });
});
