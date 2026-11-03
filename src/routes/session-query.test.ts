import { describe, expect, it } from 'bun:test';

import { findMessageElement, messageIdFromQuery, parseSessionType } from './session-query';

describe('message query parameter', () => {
  it('reads a single value or the first of several', () => {
    expect(messageIdFromQuery('abc')).toBe('abc');
    expect(messageIdFromQuery(['abc', 'def'])).toBe('abc');
  });

  it('treats a missing or empty value as no message', () => {
    expect(messageIdFromQuery(undefined)).toBeUndefined();
    expect(messageIdFromQuery('')).toBeUndefined();
    expect(messageIdFromQuery([])).toBeUndefined();
  });

  it('finds the element by its exact message id', () => {
    const elements = [{ dataset: { messageId: 'a"b' } }, { dataset: { messageId: 'target' } }];
    const root = { querySelectorAll: () => elements } as unknown as ParentNode;

    expect(findMessageElement(root, 'target')).toBe(elements[1] as unknown as HTMLElement);
    expect(findMessageElement(root, 'a"b')).toBe(elements[0] as unknown as HTMLElement);
    expect(findMessageElement(root, 'missing')).toBeNull();
  });
});

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
