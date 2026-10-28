import { describe, expect, it, spyOn } from 'bun:test';

import { createDefaultState } from './default-state';

describe('createDefaultState', () => {
  it('does not log session data', () => {
    const log = spyOn(console, 'log').mockImplementation(() => {});

    try {
      createDefaultState();

      expect(log).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });

  it('uses the default session model for the initial draft', () => {
    const state = createDefaultState();

    expect(state.settings.defaultSession.type).toBe('model');
    expect(state.draftChats.map((chat) => chat.modelId)).toEqual([
      state.settings.defaultSession.id,
    ]);
  });
});
