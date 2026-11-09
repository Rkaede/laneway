import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { transformSync } from '@babel/core';
import { afterAll, afterEach, describe, expect, it, spyOn } from 'bun:test';
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from 'typescript';

const solid: typeof import('solid-js') = await import(
  import.meta.resolve('solid-js/dist/solid.js')
);
const directory = await mkdtemp(join(tmpdir(), 'laneway-model-icon-'));
afterAll(() => rm(directory, { recursive: true, force: true }));
const stubs = join(directory, 'stubs.mjs');
await Bun.write(
  stubs,
  `import { createMemo } from ${JSON.stringify(import.meta.resolve('solid-js/dist/solid.js'))};
export const rendered = [];
const icon = (name) => () => { rendered.push(name); return null; };
export const Model = icon('model'), Creator = icon('creator'), IconBot = icon('fallback');
const models = {
  model: { icon: 'Model', creator: { icon: 'Creator' } },
  creator: { creator: { icon: 'Creator' } },
};
// Like the store's selector, each call makes a memo.
export const selectModelById = (id) => createMemo(() => models[id()]);
`,
);

// Compile without a DOM, but keep client reactivity for the icon lookup.
const source = (await Bun.file(new URL('./model-icon.tsx', import.meta.url)).text()).replace(
  /(['"])(~\/[^'"]+)\1/g,
  (_match, quote, name: string) => {
    const specifier =
      name === '~/util' ? new URL('../../util.ts', import.meta.url).href : stubs;
    return `${quote}${specifier}${quote}`;
  },
);
const jsx = transpileModule(source, {
  compilerOptions: {
    jsx: JsxEmit.Preserve,
    module: ModuleKind.ESNext,
    target: ScriptTarget.ESNext,
  },
}).outputText;
const compiled = transformSync(jsx, { presets: [['babel-preset-solid', { generate: 'ssr' }]] });
if (!compiled?.code) throw new Error('Failed to compile ModelIcon');
const code = compiled.code.replace(/from (['"])([^'"]+)\1/g, (_match, quote, name: string) => {
  const specifier = name === 'solid-js' ? 'solid-js/dist/solid.js' : name;
  return `from ${quote}${import.meta.resolve(specifier)}${quote}`;
});
const filename = join(directory, 'model-icon.mjs');
await Bun.write(filename, code);
const { ModelIcon }: typeof import('./model-icon') = await import(filename);
const { rendered }: { rendered: string[] } = await import(stubs);

let dispose = () => {};
afterEach(() => {
  dispose();
  rendered.length = 0;
});

describe('ModelIcon', () => {
  it('does not allocate memos when the model changes', () => {
    const createMemo = spyOn(solid, 'createMemo');
    try {
      const [modelId, setModelId] = solid.createSignal<string | undefined>('model');
      solid.createRoot((cleanup) => {
        dispose = cleanup;
        ModelIcon({
          get modelId() {
            return modelId();
          },
        });
      });
      const allocations = createMemo.mock.calls.length;
      expect(createMemo).toHaveBeenCalled();
      expect(rendered).toEqual(['model']);

      for (const id of ['creator', 'missing', undefined, 'model']) setModelId(id);

      expect(createMemo).toHaveBeenCalledTimes(allocations);
    } finally {
      createMemo.mockRestore();
    }
  });
});
