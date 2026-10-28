import { describe, expect, it } from 'bun:test';

import { getDocumentTitle } from './document-title';

describe('document titles', () => {
  it('uses the route title instead of an unrelated session title', () => {
    expect(
      getDocumentTitle({ title: 'Settings' }, { title: 'Previous chat', type: 'chat' }),
    ).toBe('Settings | Laneway');
  });

  it.each(['chat', 'note'] as const)('uses the current %s title', (type) => {
    expect(
      getDocumentTitle({ session: true }, { title: 'Project <plans> & ideas', type }),
    ).toBe('Project <plans> & ideas | Laneway');
  });

  it.each([
    ['chat', 'New Chat'],
    ['note', 'New Note'],
  ] as const)('falls back to %s defaults for an empty session title', (type, title) => {
    expect(getDocumentTitle({ session: true }, { title: '   ', type })).toBe(
      `${title} | Laneway`,
    );
  });

  it('identifies a missing session', () => {
    expect(getDocumentTitle({ session: true })).toBe('Session not found | Laneway');
  });

  it('identifies an unknown route even when a draft session exists', () => {
    expect(getDocumentTitle(undefined, { title: 'New Chat', type: 'chat' })).toBe(
      'Page not found | Laneway',
    );
  });
});
