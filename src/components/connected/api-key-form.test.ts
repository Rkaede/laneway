import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { transformSync } from '@babel/core';
import { afterAll, afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import type { ComponentProps } from 'solid-js';
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from 'typescript';

import type { ApiKeyFormView } from './api-key-form-view';

const solid: typeof import('solid-js') = await import(
  import.meta.resolve('solid-js/dist/solid.js')
);
const directory = await mkdtemp(join(tmpdir(), 'laneway-api-key-form-'));
afterAll(() => rm(directory, { recursive: true, force: true }));
const stubs = join(directory, 'stubs.mjs');
await Bun.write(
  stubs,
  `export const handlers = {};
export const checkApiKey = (key) => handlers.checkApiKey(key);
export const setApiKey = (key) => handlers.setApiKey(key);
export const showSuccess = (message) => handlers.showSuccess(message);
export const detectKeyKind = () => 'openrouter';
export const apiKeys = {};
export let view;
export const ApiKeyFormView = (props) => { view = props; return null; };
`,
);

// Compile without a DOM, but keep client reactivity for the field value and status.
const source = (await Bun.file(new URL('./api-key-form.tsx', import.meta.url)).text()).replace(
  /(['"])(~\/[^'"]+|\.\/api-key-form-view)\1/g,
  (_match, quote) => `${quote}${stubs}${quote}`,
);
const jsx = transpileModule(source, {
  compilerOptions: {
    jsx: JsxEmit.Preserve,
    module: ModuleKind.ESNext,
    target: ScriptTarget.ESNext,
  },
}).outputText;
const compiled = transformSync(jsx, { presets: [['babel-preset-solid', { generate: 'ssr' }]] });
if (!compiled?.code) throw new Error('Failed to compile ApiKeyForm');
const code = compiled.code.replace(/from (['"])([^'"]+)\1/g, (_match, quote, name: string) => {
  const specifier = name === 'solid-js' ? 'solid-js/dist/solid.js' : name;
  return `from ${quote}${import.meta.resolve(specifier)}${quote}`;
});
const filename = join(directory, 'api-key-form.mjs');
await Bun.write(filename, code);
const { ApiKeyForm }: typeof import('./api-key-form') = await import(filename);
const stubbed: {
  handlers: Record<string, (value: string) => unknown>;
  view: ComponentProps<typeof ApiKeyFormView>;
} = await import(stubs);

type CheckResult = 'valid' | 'invalid' | 'unknown';

let dispose = () => {};
let check: PromiseWithResolvers<CheckResult>;
const checkApiKey = mock<(key: string) => Promise<CheckResult>>(() => check.promise);
const setApiKey = mock<(key: string) => void>(() => {});
const showSuccess = mock<(message: string) => void>(() => {});
const onSaved = mock(() => {});

/** Types a key and submits it, leaving the check with OpenRouter pending. */
function submit(key: string) {
  solid.createRoot((cleanup) => {
    dispose = cleanup;
    ApiKeyForm({ onSaved });
  });
  stubbed.view.onInput(key);
  return stubbed.view.onSubmit() as unknown as Promise<void>;
}

beforeEach(() => {
  check = Promise.withResolvers<CheckResult>();
  for (const fn of [checkApiKey, setApiKey, showSuccess, onSaved]) fn.mockClear();
  Object.assign(stubbed.handlers, { checkApiKey, setApiKey, showSuccess });
});

afterEach(() => dispose());

describe('ApiKeyForm', () => {
  it('saves the key it checked', async () => {
    const pending = submit('sk-or-checked');
    expect(stubbed.view.status).toBe('checking');

    check.resolve('valid');
    await pending;

    expect(checkApiKey.mock.calls).toEqual([['sk-or-checked']]);
    expect(setApiKey.mock.calls).toEqual([['sk-or-checked']]);
    expect(showSuccess.mock.calls).toEqual([['OpenRouter key saved.']]);
    expect(onSaved).toHaveBeenCalledTimes(1);
    expect(stubbed.view.status).toBe('idle');
  });

  it('reports a rejected key without saving it', async () => {
    const pending = submit('sk-or-rejected');

    check.resolve('invalid');
    await pending;

    expect(stubbed.view.status).toBe('invalid');
    expect(setApiKey).not.toHaveBeenCalled();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it.each(['', 'sk-or-edited'])(
    'does not save or report success when the field changes to "%s" during the check',
    async (edited) => {
      const pending = submit('sk-or-checked');
      stubbed.view.onInput(edited);

      check.resolve('valid');
      await pending;

      expect(setApiKey).not.toHaveBeenCalled();
      expect(showSuccess).not.toHaveBeenCalled();
      expect(onSaved).not.toHaveBeenCalled();
      expect(stubbed.view.value).toBe(edited);
      expect(stubbed.view.status).toBe('idle');
    },
  );

  it('does not call an edited key rejected because the previous one was', async () => {
    const pending = submit('sk-or-rejected');
    stubbed.view.onInput('sk-or-edited');

    check.resolve('invalid');
    await pending;

    expect(stubbed.view.status).toBe('idle');
    expect(setApiKey).not.toHaveBeenCalled();
  });
});
