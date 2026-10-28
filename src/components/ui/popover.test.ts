import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { transformSync } from '@babel/core';
import { afterAll, describe, expect, it } from 'bun:test';
import { renderToString } from 'solid-js/web';
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from 'typescript';

const directory = await mkdtemp(join(tmpdir(), 'laneway-popover-'));
afterAll(() => rm(directory, { recursive: true, force: true }));
const primitives = join(directory, 'primitives.mjs');
await Bun.write(
  primitives,
  `import { ssrElement } from ${JSON.stringify(import.meta.resolve('solid-js/web'))};
const children = props => props.children;
export const Popover = Object.assign(children, {
  Portal: children,
  Content: children,
  CloseButton: props => ssrElement('button', {}, () => props.children),
});`,
);

// Bun doesn't compile Solid JSX. Compile for SSR and stub the popover primitives.
const source = await Bun.file(new URL('./popover.tsx', import.meta.url)).text();
const jsx = transpileModule(source, {
  compilerOptions: {
    jsx: JsxEmit.Preserve,
    module: ModuleKind.ESNext,
    target: ScriptTarget.ESNext,
  },
}).outputText;
const compiled = transformSync(jsx, { presets: [['babel-preset-solid', { generate: 'ssr' }]] });
if (!compiled?.code) throw new Error('Failed to compile PopoverContent');
const code = compiled.code.replace(/from (['"])([^'"]+)\1/g, (_match, quote, name: string) => {
  const specifier =
    name === '@kobalte/core/popover'
      ? primitives
      : name === '~/util'
        ? new URL('../../util.ts', import.meta.url).href
        : import.meta.resolve(name);
  return `from ${quote}${specifier}${quote}`;
});
const filename = join(directory, 'popover.mjs');
await Bun.write(filename, code);
const { PopoverContent }: typeof import('./popover') = await import(filename);
const render = (showCloseButton?: boolean) =>
  renderToString(() => PopoverContent({ showCloseButton, children: 'Popover content' }));

describe('PopoverContent', () => {
  it.each([undefined, false])('omits the close button when showCloseButton is %s', (value) => {
    const html = render(value);
    expect(html).toContain('Popover content');
    expect(html).not.toContain('<button');
  });

  it('renders the close button when explicitly enabled', () => {
    const html = render(true);
    expect(html).toContain('Popover content');
    expect(html).toContain('<button');
    expect(html).toContain('Close');
  });
});
