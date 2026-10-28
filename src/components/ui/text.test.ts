import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { transformSync } from '@babel/core';
import { afterAll, describe, expect, it } from 'bun:test';
import type { Component } from 'solid-js';
import { renderToString } from 'solid-js/web';
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from 'typescript';

// Bun doesn't compile Solid JSX. Compile the component for SSR.
const source = await Bun.file(new URL('./text.tsx', import.meta.url)).text();
const jsx = transpileModule(source, {
  compilerOptions: {
    jsx: JsxEmit.Preserve,
    module: ModuleKind.ESNext,
    target: ScriptTarget.ESNext,
  },
}).outputText;
const compiled = transformSync(jsx, { presets: [['babel-preset-solid', { generate: 'ssr' }]] });
if (!compiled?.code) throw new Error('Failed to compile Price');
const code = compiled.code.replace(/from (['"])([^'"]+)\1/g, (_match, quote, name: string) => {
  return `from ${quote}${import.meta.resolve(name)}${quote}`;
});
const directory = await mkdtemp(join(tmpdir(), 'laneway-text-'));
afterAll(() => rm(directory, { recursive: true, force: true }));
const filename = join(directory, 'text.mjs');
await Bun.write(filename, code);
const { Price }: { Price: Component<{ pricing?: number }> } = await import(filename);
const render = (pricing?: number) => renderToString(() => Price({ pricing }));

describe('Price', () => {
  it('shows zero cost for free pricing', () => {
    expect(render(0)).toContain('$0.00 / 1M tokens');
  });

  it('shows N/A when pricing is missing', () => {
    expect(render()).toContain('N/A');
  });

  it.each([
    [0.000001, '$1.00'],
    [0.00000015, '$0.15'],
    [0.0000025, '$2.50'],
  ] as const)('formats %s per token as %s per million', (pricing, expected) => {
    expect(render(pricing)).toContain(`${expected} / 1M tokens`);
  });
});
