import { afterAll, afterEach, beforeAll, describe, expect, it } from 'bun:test';

import { shouldIgnoreShortcut } from './command-shortcuts';

// Bun has no DOM, so this is a small element tree that matches selectors the way a browser does:
// lists of a tag, a class or an [attribute="value"], against the element or its ancestors.
class FakeElement extends EventTarget {
  parent: FakeElement | null = null;
  children: FakeElement[] = [];

  constructor(
    readonly tag: string,
    readonly attributes: Record<string, string> = {},
    children: FakeElement[] = [],
  ) {
    super();
    this.append(...children);
  }

  append(...children: FakeElement[]) {
    for (const child of children) {
      child.parent = this;
      this.children.push(child);
    }
  }

  matches(selectors: string) {
    return selectors.split(',').some((selector) => {
      const simple = selector.trim();
      const attribute = /^\[([\w-]+)="([^"]*)"\]$/.exec(simple);
      if (attribute) return this.attributes[attribute[1]] === attribute[2];
      if (/^\.[\w-]+$/.test(simple)) {
        return (this.attributes.class ?? '').split(' ').includes(simple.slice(1));
      }
      if (/^[a-z]+$/.test(simple)) return this.tag === simple;
      throw new Error(`The fake DOM cannot match "${simple}"`);
    });
  }

  closest(selectors: string): FakeElement | null {
    return this.matches(selectors) ? this : (this.parent?.closest(selectors) ?? null);
  }

  querySelector(selectors: string): FakeElement | null {
    for (const child of this.children) {
      const match = child.matches(selectors) ? child : child.querySelector(selectors);
      if (match) return match;
    }
    return null;
  }
}

const el = (tag: string, attributes?: Record<string, string>, children?: FakeElement[]) =>
  new FakeElement(tag, attributes, children);

const originals = (['Element', 'document'] as const).map(
  (name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const,
);
const body = el('body');

/** Puts elements on the page and returns the first, the one a test presses a key on. */
function mount(target: FakeElement, ...others: FakeElement[]) {
  body.append(target, ...others);
  return target;
}

function definePage() {
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { querySelector: (selectors: string) => body.querySelector(selectors) },
  });
}

beforeAll(() => {
  Object.defineProperty(globalThis, 'Element', { configurable: true, value: FakeElement });
  definePage();
});

afterEach(() => {
  body.children = [];
});

afterAll(() => {
  for (const [name, descriptor] of originals) {
    if (descriptor) {
      Object.defineProperty(globalThis, name, descriptor);
    } else {
      Reflect.deleteProperty(globalThis, name);
    }
  }
});

function keyEvent(key: string, target: EventTarget | null, defaultPrevented = false) {
  return { key, target, defaultPrevented } as KeyboardEvent;
}

const controls: [string, () => FakeElement][] = [
  ['an input', () => el('input')],
  ['a textarea', () => el('textarea')],
  ['a select', () => el('select')],
  ['an editable element', () => el('div', { contenteditable: 'true' })],
  ['the code editor', () => el('div', { class: 'cm-editor cm-focused' })],
  ['a combobox', () => el('button', { role: 'combobox' })],
  ['a listbox', () => el('ul', { role: 'listbox' })],
  ['a menu', () => el('div', { role: 'menu' })],
  ['a listbox trigger', () => el('button', { 'aria-haspopup': 'listbox' })],
  ['a menu trigger', () => el('button', { 'aria-haspopup': 'menu' })],
  ['a popup trigger', () => el('button', { 'aria-haspopup': 'true' })],
  ['a dialog', () => el('div', { role: 'dialog' })],
  ['an alert dialog', () => el('div', { role: 'alertdialog' })],
];

const others: [string, () => FakeElement][] = [
  ['a button', () => el('button')],
  ['a link', () => el('a', { class: 'group' })],
  ['a dialog trigger', () => el('button', { 'aria-haspopup': 'dialog' })],
  ['a read-only element', () => el('div', { contenteditable: 'false' })],
  ['an element with another role', () => el('div', { role: 'status' })],
  ['an element that names a dialog elsewhere', () => el('div', { 'data-role': 'dialog' })],
  ['an element with a similar class', () => el('div', { class: 'cm-editor-wrapper' })],
];

describe('shouldIgnoreShortcut', () => {
  for (const key of ['c', 'n']) {
    it.each(controls)(`ignores ${key} on %s`, (_name, create) => {
      expect(shouldIgnoreShortcut(keyEvent(key, mount(create())))).toBe(true);
    });

    it.each(controls)(`ignores ${key} on an element inside %s`, (_name, create) => {
      const target = el('span');
      const control = create();
      control.append(el('div', {}, [target]));
      mount(control);

      expect(shouldIgnoreShortcut(keyEvent(key, target))).toBe(true);
    });

    it.each(others)(`allows ${key} on %s`, (_name, create) => {
      expect(shouldIgnoreShortcut(keyEvent(key, mount(create())))).toBe(false);
    });

    it(`ignores ${key} when another handler has prevented it`, () => {
      expect(shouldIgnoreShortcut(keyEvent(key, mount(el('button')), true))).toBe(true);
    });

    it(`allows ${key} without an element to check`, () => {
      expect(shouldIgnoreShortcut(keyEvent(key, null))).toBe(false);
      expect(shouldIgnoreShortcut(keyEvent(key, new EventTarget()))).toBe(false);
    });

    it.each(['dialog', 'alertdialog'])(
      `ignores ${key} outside an open %s, and allows it once that has closed`,
      (role) => {
        // The image lightbox is a dialog that leaves focus on the page behind it.
        const target = mount(el('button'), el('div', {}, [el('div', { role })]));
        expect(shouldIgnoreShortcut(keyEvent(key, target))).toBe(true);

        body.children = [target];
        expect(shouldIgnoreShortcut(keyEvent(key, target))).toBe(false);
      },
    );

    it(`checks only the target for ${key} where there is no document`, () => {
      const inDialog = el('button');
      mount(el('button'), el('div', { role: 'dialog' }, [inDialog]));
      Reflect.deleteProperty(globalThis, 'document');
      try {
        expect(shouldIgnoreShortcut(keyEvent(key, body.children[0]))).toBe(false);
        expect(shouldIgnoreShortcut(keyEvent(key, inDialog))).toBe(true);
      } finally {
        definePage();
      }
    });
  }
});
