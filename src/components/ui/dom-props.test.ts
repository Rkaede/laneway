import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

import { transformSync } from '@babel/core';
import { afterAll, describe, expect, it } from 'bun:test';
import { renderToString } from 'solid-js/web';
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from 'typescript';

const directory = await mkdtemp(join(tmpdir(), 'laneway-dom-props-'));
afterAll(() => rm(directory, { recursive: true, force: true }));
const stubs = join(directory, 'icons.mjs');
await Bun.write(
  stubs,
  `import { ssrElement } from ${JSON.stringify(import.meta.resolve('solid-js/web'))};
const icon = name => props => ssrElement('svg', { ...props, 'data-icon': name });
export const Model = icon('model'), Creator = icon('creator'), IconBot = icon('fallback');
export const selectModelById = getId => () => ({
  model: { icon: 'Model' },
  creator: { creator: { icon: 'Creator' } },
})[getId()];
`,
);

// Bun doesn't compile Solid JSX. Compile for SSR and replace only icon dependencies.
async function loadComponent(relativePath: string, imports: Record<string, string> = {}) {
  const source = (await Bun.file(new URL(relativePath, import.meta.url)).text()).replace(
    /^import ['"].*\.css['"];\n/m,
    '',
  );
  const jsx = transpileModule(source, {
    compilerOptions: {
      jsx: JsxEmit.Preserve,
      module: ModuleKind.ESNext,
      target: ScriptTarget.ESNext,
    },
  }).outputText;
  const compiled = transformSync(jsx, {
    presets: [['babel-preset-solid', { generate: 'ssr' }]],
  });
  if (!compiled?.code) throw new Error(`Failed to compile ${relativePath}`);
  const code = compiled.code.replace(
    /from (['"])([^'"]+)\1/g,
    (_match, quote, name: string) => {
      const specifier =
        imports[name] ??
        (name.startsWith('~/')
          ? new URL(`../../${name.slice(2)}`, import.meta.url).href
          : name);
      return `from ${quote}${import.meta.resolve(specifier)}${quote}`;
    },
  );
  const filename = join(directory, `${basename(relativePath, '.tsx')}.mjs`);
  await Bun.write(filename, code);
  return import(filename);
}

const { ModelIcon }: typeof import('../connected/model-icon') = await loadComponent(
  '../connected/model-icon.tsx',
  {
    '~/components/icons/creators': stubs,
    '~/components/icons/models': stubs,
    '~/components/icons/ui': stubs,
    '~/store/selectors': stubs,
  },
);
const { Avatar }: typeof import('./avatar') = await loadComponent('./avatar.tsx', {
  '../connected': join(directory, 'model-icon.mjs'),
});
const { SidebarIcon }: typeof import('./sidebar-icon') =
  await loadComponent('./sidebar-icon.tsx');

describe('component DOM props', () => {
  it.each([
    ['model', 'model'],
    ['creator', 'creator'],
    ['missing', 'fallback'],
  ])('selects the %s icon without forwarding modelId', (modelId, icon) => {
    const html = renderToString(() => ModelIcon({ modelId, class: 'size-5' }));

    expect(html).toContain(`data-icon="${icon}"`);
    expect(html).toMatch(/class="size-5 pointer-events-none\s*"/);
    expect(html).not.toMatch(/\smodelid=/i);
  });

  it('keeps avatar DOM attributes and icon sizing without forwarding modelId', () => {
    const html = renderToString(() =>
      Avatar({ modelId: 'model', size: 'lg', id: 'avatar', title: 'Model avatar' }),
    );

    expect(html).toContain('id="avatar"');
    expect(html).toContain('title="Model avatar"');
    expect(html).toContain('data-icon="model"');
    expect(html).toMatch(/class="size-6 pointer-events-none\s*"/);
    expect(html).not.toMatch(/\smodelid=/i);
  });

  it('preserves avatar fallback content', () => {
    expect(renderToString(() => Avatar({ children: 'AB' }))).toContain('>AB</div>');
  });

  it.each([true, false])('exposes sidebar state only through data-open (%s)', (open) => {
    const html = renderToString(() => SidebarIcon({ open }));

    expect(html).toContain(`data-open="${open}"`);
    expect(html).not.toMatch(/\sopen(?:=|\s|>)/);
    expect(html.match(/<line\b/g)).toHaveLength(2);
  });
});
