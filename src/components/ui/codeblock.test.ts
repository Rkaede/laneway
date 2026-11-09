import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { transformSync } from '@babel/core';
import { afterAll, afterEach, describe, expect, it, mock, spyOn } from 'bun:test';
import type { JSX } from 'solid-js';
import { renderToString } from 'solid-js/web';
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from 'typescript';

const directory = await mkdtemp(join(tmpdir(), 'laneway-codeblock-'));
afterAll(() => rm(directory, { recursive: true, force: true }));

// Stand-ins for the components around the code. Menu items record their props, so the tests can
// choose one.
const components = join(directory, 'components.mjs');
await Bun.write(
  components,
  `const children = props => props.children;
export const menuItems = [];
export const Button = children, CodeHighlighter = () => '';
export const DropdownMenu = children, DropdownMenuContent = children;
export const DropdownMenuGroup = children, DropdownMenuTrigger = children;
export const DropdownMenuItem = props => (menuItems.push(props), props.children);
`,
);

// Bun doesn't compile Solid JSX. Compile the component for SSR.
const source = await Bun.file(new URL('./codeblock.tsx', import.meta.url)).text();
const jsx = transpileModule(source, {
  compilerOptions: {
    jsx: JsxEmit.Preserve,
    module: ModuleKind.ESNext,
    target: ScriptTarget.ESNext,
  },
}).outputText;
const compiled = transformSync(jsx, { presets: [['babel-preset-solid', { generate: 'ssr' }]] });
if (!compiled?.code) throw new Error('Failed to compile CodeBlock');
const staticImports: string[] = [];
const code = compiled.code.replace(/from (['"])([^'"]+)\1/g, (_match, quote, name: string) => {
  staticImports.push(name);
  const specifier = ['./button', './code-highlighter', './dropdown'].includes(name)
    ? components
    : name.startsWith('~/')
      ? new URL(`../../${name.slice(2)}`, import.meta.url).href
      : name;
  return `from ${quote}${import.meta.resolve(specifier)}${quote}`;
});
const filename = join(directory, 'codeblock.mjs');
await Bun.write(filename, code);
const { CodeBlock, programmingLanguages }: typeof import('./codeblock') = await import(
  filename
);
const {
  menuItems,
}: {
  menuItems: { onClick: () => void; children: JSX.Element }[];
} = await import(components);

describe('programmingLanguages', () => {
  it('has a download extension for every grammar and alias the highlighter loads', async () => {
    const highlighting = await Bun.file(
      new URL('./code-highlighting.ts', import.meta.url),
    ).text();
    const grammars = [...highlighting.matchAll(/import\('(shiki\/langs\/[\w-]+\.mjs)'\)/g)];
    expect(grammars.length).toBeGreaterThan(20);

    const languages = await Promise.all(
      grammars.map(async ([, specifier]) => {
        // A grammar module lists the grammars it embeds first and its own last.
        const { name, aliases = [] } = (await import(specifier)).default.at(-1);
        return [name, ...aliases] as string[];
      }),
    );
    const missing = languages.flat().filter((id) => !programmingLanguages[id]?.startsWith('.'));

    expect(languages.flat()).toContain('ts');
    expect(missing).toEqual([]);
  });
});

describe('CodeBlock', () => {
  const originals = (['document', 'window'] as const).map(
    (name) => [name, Object.getOwnPropertyDescriptor(globalThis, name)] as const,
  );

  afterEach(() => {
    mock.restore();
    menuItems.length = 0;
    for (const [name, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, name, descriptor);
      else Reflect.deleteProperty(globalThis, name);
    }
  });

  it('loads html-to-image only when a screenshot is taken', () => {
    expect(staticImports).toContain('solid-js');
    expect(staticImports).not.toContain('html-to-image');
    expect(compiled.code).toContain("import('html-to-image')");
  });

  it.each([
    ['ts', '.ts'],
    ['bash', '.sh'],
    ['unknown-language', '.txt'],
  ])(
    'downloads %s code as a %s file and keeps the URL alive for the click',
    async (language, extension) => {
      const attributes = new Map<string, string>();
      const link = {
        setAttribute: (name: string, value: string) => attributes.set(name, value),
        style: { display: '' },
        click: mock(() => {}),
      };
      Object.defineProperty(globalThis, 'window', { configurable: true, value: {} });
      Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: { createElement: () => link, body: { appendChild() {}, removeChild() {} } },
      });
      const createUrl = spyOn(URL, 'createObjectURL').mockReturnValue('blob:code');
      const revokeUrl = spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});

      renderToString(() => CodeBlock({ language, code: 'const value = 1;' }));
      const downloadFile = menuItems.find((item) =>
        [item.children].flat().join('').includes('Download File'),
      );
      downloadFile?.onClick();

      expect(link.click).toHaveBeenCalledTimes(1);
      expect(attributes.get('href')).toBe('blob:code');
      expect(attributes.get('download')).toMatch(
        new RegExp(`^\\d{4}-\\d{2}-\\d{2}_\\d{2}-\\d{2}-\\d{2}\\${extension}$`),
      );
      expect(await (createUrl.mock.calls[0][0] as Blob).text()).toBe('const value = 1;');
      expect(revokeUrl).not.toHaveBeenCalled();
      await Bun.sleep(10);
      expect(revokeUrl).toHaveBeenCalledWith('blob:code');
    },
  );
});
