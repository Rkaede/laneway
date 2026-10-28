import { describe, expect, it } from 'bun:test';

import { parseSessionType } from './session-query';

describe('session type query parameter', () => {
  it.each(['chat', 'note'] as const)('preserves a valid %s type', (type) => {
    expect(parseSessionType(type)).toBe(type);
  });

  it.each([undefined, '', 'invalid', 'Note', 'CHAT', ' note ', 'chat,note'])(
    'defaults a missing or invalid type (%j) to chat',
    (type) => {
      expect(parseSessionType(type)).toBe('chat');
    },
  );

  it('defaults repeated type parameters to chat', () => {
    expect(parseSessionType(['note', 'chat'])).toBe('chat');
    expect(parseSessionType(['chat', 'note'])).toBe('chat');
    expect(parseSessionType(['note', 'note'])).toBe('chat');
    expect(parseSessionType(['invalid', 'note'])).toBe('chat');
  });
});
