import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { transformSync } from '@babel/core';
import { afterAll, afterEach, describe, expect, it } from 'bun:test';
import type { ComponentProps } from 'solid-js';
import { renderToString } from 'solid-js/web';
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from 'typescript';

const directory = await mkdtemp(join(tmpdir(), 'laneway-multi-combobox-'));
afterAll(() => rm(directory, { recursive: true, force: true }));
const stubs = join(directory, 'stubs.mjs');
await Bun.write(
  stubs,
  `import { ssrElement } from 'solid-js/web';
const model = { id: 'model', title: 'GPT-4.1' };
export const store = {
  assistants: [{ id: 'assistant', title: 'Helper', modelId: model.id }],
  presets: [{ id: 'preset', presetTitle: 'Daily Driver' }],
};
export const modelsByCreator = () => [{ title: 'OpenAI', models: [model] }];
export const selectModelById = id => () => id() === model.id ? model : undefined;
export const selectAssistantById = id => () => store.assistants.find(item => item.id === id());
export const selectPresetById = id => () => store.presets.find(item => item.id === id());
export const ModelIcon = () => null;
export const IconCheck = ModelIcon, IconChevronsUpDown = ModelIcon, IconLayoutGrid = ModelIcon,
  CommandInput = ModelIcon, CommandEmpty = ModelIcon;
export const Button = props => ssrElement('button', {}, () => props.children);
const children = props => props.children;
export const Popover = children, PopoverContent = children, PopoverTrigger = children,
  CommandList = children, CommandGroup = children;
let search = '', filter;
export const setSearch = value => { search = value; };
export const Command = props => { filter = props.filter; return props.children; };
export const CommandItem = props => filter(props.value, search, props.keywords) ? props.children : null;
`.replace("'solid-js/web'", JSON.stringify(import.meta.resolve('solid-js/web'))),
);

// Compile Solid JSX for SSR and stub primitives/store to test labels and search together.
const source = (
  await Bun.file(new URL('./multi-combobox.tsx', import.meta.url)).text()
).replace(/(['"])(~\/[^'"]+|\.\/model-icon)\1/g, (_match, quote, name: string) => {
  const specifier = name === '~/util' ? new URL('../../util.ts', import.meta.url).href : stubs;
  return `${quote}${specifier}${quote}`;
});
const jsx = transpileModule(source, {
  compilerOptions: {
    jsx: JsxEmit.Preserve,
    module: ModuleKind.ESNext,
    target: ScriptTarget.ESNext,
  },
}).outputText;
const compiled = transformSync(jsx, { presets: [['babel-preset-solid', { generate: 'ssr' }]] });
if (!compiled?.code) throw new Error('Failed to compile MultiCombobox');
const code = compiled.code.replace(/from (['"])([^'"]+)\1/g, (_match, quote, name: string) => {
  return `from ${quote}${import.meta.resolve(name)}${quote}`;
});
const filename = join(directory, 'multi-combobox.mjs');
await Bun.write(filename, code);
const { MultiCombobox }: typeof import('./multi-combobox') = await import(filename);
const { setSearch }: { setSearch: (value: string) => void } = await import(stubs);
afterEach(() => setSearch(''));

type Value = ComponentProps<typeof MultiCombobox>['value'];
const render = (value?: Value) =>
  renderToString(() =>
    MultiCombobox({
      value,
      includeAssistants: true,
      includeModels: true,
      includePresets: true,
      showType: true,
      onSelect: () => {},
    }),
  );
const trigger = (value?: Value) => render(value).match(/<button[^>]*>(.*?)<\/button>/s)?.[1];

describe('MultiCombobox', () => {
  it('shows the placeholder without a value', () => {
    expect(trigger()).toContain('Select item...');
  });

  it.each(['model', 'assistant', 'preset'] as const)(
    'shows the placeholder for an empty or unresolved %s value object',
    (type) => {
      for (const id of [undefined, '', 'missing']) {
        const html = trigger({ type, id });
        expect(html).toContain('Select item...');
        expect(html).not.toContain('()');
      }
    },
  );

  it.each([
    ['model', 'GPT-4.1'],
    ['assistant', 'Helper'],
    ['preset', 'Daily Driver'],
  ] as const)('shows the resolved %s title and type', (type, title) => {
    const html = trigger({ type, id: type });
    expect(html).toContain(title);
    expect(html).toContain(`(${type})`);
    expect(html).not.toContain('Select item...');
  });

  it.each([
    ['gPt-4', 'GPT-4.1'],
    ['oPeNaI', 'GPT-4.1'],
    ['heLP', 'Helper'],
    ['daily', 'Daily Driver'],
  ])('matches %s by title or model creator, ignoring case', (search, title) => {
    setSearch(search);
    const html = render();
    expect(html).toContain(title);
    for (const other of ['GPT-4.1', 'Helper', 'Daily Driver'].filter(
      (item) => item !== title,
    )) {
      expect(html).not.toContain(other);
    }
  });

  it('does not return unrelated options', () => {
    setSearch('no match');
    const html = render();
    for (const title of ['GPT-4.1', 'Helper', 'Daily Driver']) {
      expect(html).not.toContain(title);
    }
  });
});
