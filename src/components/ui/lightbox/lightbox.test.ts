import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { transformSync } from '@babel/core';
import { afterAll, afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from 'typescript';

const solid: typeof import('solid-js') = await import(
  import.meta.resolve('solid-js/dist/solid.js')
);

// Compile without a DOM, but use client reactivity to exercise listener cleanup.
const source = (await Bun.file(new URL('./lightbox.tsx', import.meta.url)).text()).replace(
  "import { LocalImage } from '~/components/ui/local-image';",
  'const LocalImage = () => null;',
);
const jsx = transpileModule(source, {
  compilerOptions: {
    jsx: JsxEmit.Preserve,
    module: ModuleKind.ESNext,
    target: ScriptTarget.ESNext,
  },
}).outputText;
const compiled = transformSync(jsx, { presets: [['babel-preset-solid', { generate: 'ssr' }]] });
if (!compiled?.code) throw new Error('Failed to compile Lightbox');
const code = compiled.code.replace(/from (['"])([^'"]+)\1/g, (_match, quote, name: string) => {
  const specifier = name === 'solid-js' ? 'solid-js/dist/solid.js' : name;
  return `from ${quote}${import.meta.resolve(specifier)}${quote}`;
});
const directory = await mkdtemp(join(tmpdir(), 'laneway-lightbox-'));
afterAll(() => rm(directory, { recursive: true, force: true }));
const filename = join(directory, 'lightbox.mjs');
await Bun.write(filename, code);
const { Lightbox }: typeof import('./lightbox') = await import(filename);

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
let target: EventTarget;
let dispose = () => {};

beforeEach(() => {
  target = new EventTarget();
  Object.defineProperty(globalThis, 'window', { configurable: true, value: target });
});

afterEach(() => {
  dispose();
  mock.restore();
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else Reflect.deleteProperty(globalThis, 'window');
});

function setup(open = false) {
  const [isOpen, setIsOpen] = solid.createSignal(open);
  const onClose = mock(() => {});
  solid.createRoot((cleanup) => {
    dispose = cleanup;
    Lightbox({
      images: [],
      get open() {
        return isOpen();
      },
      onClose,
    });
  });
  return { setIsOpen, onClose };
}

function pressEscape() {
  target.dispatchEvent(Object.assign(new Event('keydown'), { key: 'Escape' }));
}

describe('lightbox keyboard listener', () => {
  it('removes the listener on close and handles each reopening only once', () => {
    const addListener = spyOn(target, 'addEventListener');
    const removeListener = spyOn(target, 'removeEventListener');
    const { setIsOpen, onClose } = setup();
    expect(addListener).not.toHaveBeenCalled();

    for (let i = 0; i < 3; i++) {
      setIsOpen(true);
      expect(addListener).toHaveBeenCalledTimes(i + 1);

      pressEscape();
      expect(onClose).toHaveBeenCalledTimes(i + 1);
      expect(removeListener.mock.calls).toEqual(addListener.mock.calls);

      pressEscape();
      expect(onClose).toHaveBeenCalledTimes(i + 1);
      setIsOpen(false);
    }
  });

  it('removes the listener when closed externally', () => {
    const addListener = spyOn(target, 'addEventListener');
    const removeListener = spyOn(target, 'removeEventListener');
    const { setIsOpen, onClose } = setup(true);
    expect(addListener).toHaveBeenCalledTimes(1);

    setIsOpen(false);
    pressEscape();

    expect(removeListener.mock.calls).toEqual(addListener.mock.calls);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('removes the listener when unmounted while open', () => {
    const addListener = spyOn(target, 'addEventListener');
    const removeListener = spyOn(target, 'removeEventListener');
    const { onClose } = setup(true);
    expect(addListener).toHaveBeenCalledTimes(1);

    dispose();
    pressEscape();

    expect(removeListener.mock.calls).toEqual(addListener.mock.calls);
    expect(onClose).not.toHaveBeenCalled();
  });
});
