import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { transformSync } from '@babel/core';
import type { EditorView } from '@codemirror/view';
import {
  afterAll,
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
  mock,
  spyOn,
} from 'bun:test';
import * as codeMirror from 'solid-codemirror';
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from 'typescript';

const solid: typeof import('solid-js') = await import(
  import.meta.resolve('solid-js/dist/solid.js')
);
const directory = await mkdtemp(join(tmpdir(), 'laneway-text-editor-'));
afterAll(() => rm(directory, { recursive: true, force: true }));
const stubs = join(directory, 'stubs.mjs');
await Bun.write(
  stubs,
  `export const store = { featureFlags: { completions: false } };
export const getCompletion = async () => '';
`,
);

// Compile without a DOM, but use client reactivity to exercise timer cleanup.
const source = (await Bun.file(new URL('./text-editor.tsx', import.meta.url)).text()).replace(
  "import './text-editor.css';",
  '',
);
const jsx = transpileModule(source, {
  compilerOptions: {
    jsx: JsxEmit.Preserve,
    module: ModuleKind.ESNext,
    target: ScriptTarget.ESNext,
  },
}).outputText;
const compiled = transformSync(jsx, { presets: [['babel-preset-solid', { generate: 'ssr' }]] });
if (!compiled?.code) throw new Error('Failed to compile TextEditor');
const code = compiled.code.replace(/from (['"])([^'"]+)\1/g, (_match, quote, name: string) => {
  const specifier = name === 'solid-js' ? 'solid-js/dist/solid.js' : name;
  return `from ${quote}${name === '~/store' || name === '~/store/actions' ? stubs : import.meta.resolve(specifier)}${quote}`;
});
const filename = join(directory, 'text-editor.mjs');
await Bun.write(filename, code);
const { TextEditor }: typeof import('./text-editor') = await import(filename);

const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
let editorView: EditorView | undefined;
let dispose = () => {};

beforeEach(() => {
  jest.useFakeTimers();
  editorView = undefined;
  dispose = () => {};
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      matchMedia: () => ({
        matches: false,
        addEventListener: () => {},
        removeEventListener: () => {},
      }),
    },
  });
  spyOn(codeMirror, 'createCodeMirror').mockImplementation(() => ({
    editorView: () => editorView,
    ref: solid.createSignal<HTMLElement>()[1],
    createExtension: () => () => {},
  }));
  spyOn(codeMirror, 'createEditorReadonly').mockImplementation(() => {});
});

afterEach(() => {
  dispose();
  jest.useRealTimers();
  mock.restore();
  if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
  else Reflect.deleteProperty(globalThis, 'window');
});

function setup() {
  const view = {
    state: { doc: { length: 10 } },
    hasFocus: false,
    focus: mock(() => {}),
    dispatch: mock<EditorView['dispatch']>(() => {}),
  };
  solid.createRoot((cleanup) => {
    dispose = cleanup;
    TextEditor({});
  });
  return view;
}

describe('editor initial focus', () => {
  it('clears the interval when unmounted before the editor is ready', () => {
    const view = setup();
    jest.advanceTimersByTime(100);
    expect(view.focus).not.toHaveBeenCalled();

    dispose();
    editorView = view as unknown as EditorView;
    jest.advanceTimersByTime(300);

    expect(view.focus).not.toHaveBeenCalled();
    expect(view.dispatch).not.toHaveBeenCalled();
  });

  it('stops retrying focus when unmounted before focus succeeds', () => {
    const view = setup();
    editorView = view as unknown as EditorView;
    jest.advanceTimersByTime(100);
    expect(view.focus).toHaveBeenCalledTimes(1);

    dispose();
    jest.advanceTimersByTime(300);

    expect(view.focus).toHaveBeenCalledTimes(1);
    expect(view.dispatch).toHaveBeenCalledTimes(1);
  });

  it('waits for the editor and stops retrying after focusing it', () => {
    const view = setup();
    jest.advanceTimersByTime(100);
    expect(view.focus).not.toHaveBeenCalled();

    view.focus.mockImplementation(() => {
      view.hasFocus = true;
    });
    editorView = view as unknown as EditorView;
    jest.advanceTimersByTime(300);

    expect(view.focus).toHaveBeenCalledTimes(1);
    expect(view.dispatch.mock.calls).toEqual([[{ selection: { anchor: 10 } }]]);
  });
});
