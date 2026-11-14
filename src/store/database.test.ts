import { expect, it } from 'bun:test';

Object.defineProperty(globalThis, 'self', { value: globalThis, configurable: true });
const { unusedImages } = await import('./database');

it('keeps images that an unsaved chat in memory still shows', () => {
  const unsavedFork = {
    messages: [
      {
        id: 'm1',
        role: 'user' as const,
        content: [
          { type: 'image' as const, image: { filename: 'a.png', storageId: 'shared' } },
        ],
      },
    ],
  };
  expect(unusedImages(['shared', 'gone'], [unsavedFork])).toEqual(['gone']);
});
