import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { transformSync } from '@babel/core';
import { afterAll, describe, expect, it } from 'bun:test';
import { renderToString } from 'solid-js/web';
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from 'typescript';

// Bun doesn't compile Solid JSX. Compile for SSR and stub the button primitive.
const source = (
  await Bun.file(new URL('./collection-empty-state.tsx', import.meta.url)).text()
).replace(
  "import { Button } from '~/components/ui/button';",
  'const Button = (props) => <button onClick={props.onClick}>{props.children}</button>;',
);
const jsx = transpileModule(source, {
  compilerOptions: {
    jsx: JsxEmit.Preserve,
    module: ModuleKind.ESNext,
    target: ScriptTarget.ESNext,
  },
}).outputText;
const compiled = transformSync(jsx, { presets: [['babel-preset-solid', { generate: 'ssr' }]] });
if (!compiled?.code) throw new Error('Failed to compile CollectionEmptyState');
const code = compiled.code.replace(/from (['"])([^'"]+)\1/g, (_match, quote, name: string) => {
  return `from ${quote}${import.meta.resolve(name)}${quote}`;
});
const directory = await mkdtemp(join(tmpdir(), 'laneway-empty-state-'));
afterAll(() => rm(directory, { recursive: true, force: true }));
const filename = join(directory, 'collection-empty-state.mjs');
await Bun.write(filename, code);
const { CollectionEmptyState }: typeof import('./collection-empty-state') = await import(
  filename
);

describe('CollectionEmptyState', () => {
  it.each(['assistants', 'presets'])('explains how to populate empty %s', (name) => {
    const html = renderToString(() =>
      CollectionEmptyState({
        name,
        description: 'Create an item or add one from the library.',
        searchTerm: '',
        onClearSearch: () => {},
      }),
    );

    expect(html).toContain(`No ${name} yet.`);
    expect(html).toContain('Create an item or add one from the library.');
    expect(html).not.toContain('Clear search');
  });

  it.each(['assistants', 'presets'])('offers recovery when a search matches no %s', (name) => {
    const html = renderToString(() =>
      CollectionEmptyState({
        name,
        description: 'Create an item or add one from the library.',
        searchTerm: 'no match',
        onClearSearch: () => {},
      }),
    );

    expect(html).toContain(`No ${name} match your search.`);
    expect(html).toContain('<button>Clear search</button>');
    expect(html).not.toContain(`No ${name} yet.`);
    expect(html).not.toContain('Create an item or add one from the library.');
  });
});
