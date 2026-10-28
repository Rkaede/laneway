import { afterAll, beforeAll, describe, expect, it } from 'bun:test';

import { shouldIgnoreShortcut } from './command-shortcuts';

const originalElement = Object.getOwnPropertyDescriptor(globalThis, 'Element');

// Bun has no DOM; closest represents the matching control or an ancestor.
class ShortcutTarget extends EventTarget {
  constructor(private selector?: string) {
    super();
  }

  closest(selectors: string) {
    return selectors.split(', ').includes(this.selector ?? '') ? this : null;
  }
}

beforeAll(() => {
  Object.defineProperty(globalThis, 'Element', { configurable: true, value: ShortcutTarget });
});

afterAll(() => {
  if (originalElement) {
    Object.defineProperty(globalThis, 'Element', originalElement);
  } else {
    Reflect.deleteProperty(globalThis, 'Element');
  }
});

function keyEvent(key: string, target: EventTarget | null, defaultPrevented = false) {
  return { key, target, defaultPrevented } as KeyboardEvent;
}

describe('shouldIgnoreShortcut', () => {
  for (const key of ['c', 'n']) {
    it.each([
      'input',
      'textarea',
      'select',
      '[contenteditable="true"]',
      '.cm-editor',
      '[role="combobox"]',
      '[role="listbox"]',
      '[role="menu"]',
      '[aria-haspopup="listbox"]',
      '[aria-haspopup="menu"]',
      '[aria-haspopup="true"]',
    ])(`ignores ${key} inside %s`, (selector) => {
      expect(shouldIgnoreShortcut(keyEvent(key, new ShortcutTarget(selector)))).toBe(true);
    });

    it(`ignores ${key} when another handler has prevented it`, () => {
      expect(shouldIgnoreShortcut(keyEvent(key, new ShortcutTarget(), true))).toBe(true);
    });

    it(`allows ${key} outside an input or composite control`, () => {
      expect(shouldIgnoreShortcut(keyEvent(key, new ShortcutTarget()))).toBe(false);
      expect(shouldIgnoreShortcut(keyEvent(key, null))).toBe(false);
      expect(shouldIgnoreShortcut(keyEvent(key, new EventTarget()))).toBe(false);
    });
  }
});
