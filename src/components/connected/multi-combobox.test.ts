import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { transformSync } from '@babel/core';
import { afterAll, afterEach, describe, expect, it, spyOn } from 'bun:test';
import type { ComponentProps } from 'solid-js';
import { renderToString } from 'solid-js/web';
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from 'typescript';

const solid: typeof import('solid-js') = await import(
  import.meta.resolve('solid-js/dist/solid.js')
);
const directory = await mkdtemp(join(tmpdir(), 'laneway-multi-combobox-'));
afterAll(() => rm(directory, { recursive: true, force: true }));
const stubs = join(directory, 'stubs.mjs');
await Bun.write(
  stubs,
  `import { createSignal } from 'solid-js/dist/solid.js';
import { ssrElement } from 'solid-js/web';
const model = { id: 'model', title: 'GPT-4.1' };
export const models = [model];
export const [assistantTitle, setAssistantTitle] = createSignal('Helper');
export const store = {
  assistants: [{ id: 'assistant', get title() { return assistantTitle(); }, modelId: model.id }],
  presets: [{ id: 'preset', presetTitle: 'Daily Driver' }],
};
export const modelsByCreator = () => [{ title: 'OpenAI', models: [model] }];
export const ModelIcon = () => null;
export const IconCheck = ModelIcon, IconChevronsUpDown = ModelIcon, IconLayoutGrid = ModelIcon,
  CommandInput = ModelIcon, CommandEmpty = ModelIcon;
let triggerProps;
export const renderTrigger = () => ssrElement('button', {}, () => triggerProps.children);
export const Button = props => { triggerProps = props; return renderTrigger(); };
const children = props => props.children;
export const Popover = children, PopoverContent = children, PopoverTrigger = children,
  CommandList = children, CommandGroup = children;
let search = '', filter;
export const setSearch = value => { search = value; };
export const Command = props => { filter = props.filter; return props.children; };
export const CommandItem = props => filter(props.value, search, props.keywords) ? props.children : null;
`
    .replace("'solid-js/web'", JSON.stringify(import.meta.resolve('solid-js/web')))
    .replace(
      "'solid-js/dist/solid.js'",
      JSON.stringify(import.meta.resolve('solid-js/dist/solid.js')),
    ),
);

// Compile without a DOM, but keep client reactivity for selected records.
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
  const specifier = name === 'solid-js' ? 'solid-js/dist/solid.js' : name;
  return `from ${quote}${import.meta.resolve(specifier)}${quote}`;
});
const filename = join(directory, 'multi-combobox.mjs');
await Bun.write(filename, code);
const { MultiCombobox }: typeof import('./multi-combobox') = await import(filename);
const { setSearch, setAssistantTitle, renderTrigger, models, store } = await import(stubs);
const disposers: (() => void)[] = [];
afterEach(() => {
  disposers.splice(0).forEach((dispose) => dispose());
  setSearch('');
  setAssistantTitle('Helper');
});

type Value = ComponentProps<typeof MultiCombobox>['value'];
const render = (value?: Value | (() => Value)) =>
  renderToString(() =>
    solid.createRoot((dispose) => {
      disposers.push(dispose);
      return MultiCombobox({
        get value() {
          return typeof value === 'function' ? value() : value;
        },
        includeAssistants: true,
        includeModels: true,
        includePresets: true,
        showType: true,
        onSelect: () => {},
      });
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

  it.each(['model', 'assistant', 'preset'] as const)(
    'reuses the selected %s lookup across trigger reads',
    (type) => {
      const items = { model: models, assistant: store.assistants, preset: store.presets }[type];
      const find = spyOn(items, 'find');
      try {
        render({ type, id: type });
        expect(find).toHaveBeenCalledTimes(1);

        for (let i = 0; i < 5; i++) renderToString(renderTrigger);

        expect(find).toHaveBeenCalledTimes(1);
      } finally {
        find.mockRestore();
      }
    },
  );

  it('updates the trigger when the selected ID, type or record changes', () => {
    const [value, setValue] = solid.createSignal<Value>({ type: 'model', id: 'model' });
    render(value);
    expect(renderToString(renderTrigger)).toContain('GPT-4.1');

    setValue({ type: 'assistant', id: 'assistant' });
    expect(renderToString(renderTrigger)).toContain('Helper');
    setAssistantTitle('Updated helper');
    expect(renderToString(renderTrigger)).toContain('Updated helper');

    setValue({ type: 'preset', id: 'preset' });
    expect(renderToString(renderTrigger)).toContain('Daily Driver');
    setValue({ type: 'preset', id: 'missing' });
    expect(renderToString(renderTrigger)).toContain('Select item...');
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
