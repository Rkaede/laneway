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

// Plain elements standing in for the Kobalte and cmdk primitives, which need a browser.
const primitives = join(directory, 'primitives.mjs');
await Bun.write(
  primitives,
  `import { ssrElement } from ${JSON.stringify(import.meta.resolve('solid-js/web'))};
const element = (tag, fixed) => props =>
  ssrElement(tag, { ...fixed, ...props }, undefined, false);
const children = props => props.children;
export const Button = element('button'), TextArea = element('textarea');
export const Root = children, Label = children, Thumb = children;
export const Input = element('input'), Control = element('div');
export const Dialog = children, DialogContent = element('div', { role: 'dialog' });
export const Tooltip = children, TooltipContent = children;
export const TooltipTrigger = ({ as, ...props }) => ssrElement(as, props, undefined, false);
export const CommandRoot = children;
const icon = name => element('svg', { 'data-icon': name });
export const icons = { free: icon('free'), vision: icon('vision') };
`,
);

// Bun doesn't compile Solid JSX. Compile for SSR and replace only the dependencies in imports.
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
  '~/components/connected/model-icon': join(directory, 'model-icon.mjs'),
});
const { SidebarIcon }: typeof import('./sidebar-icon') =
  await loadComponent('./sidebar-icon.tsx');
const { SidebarItem, SidebarLinkItem }: typeof import('./sidebar') =
  await loadComponent('./sidebar.tsx');
const { Input }: typeof import('./input') = await loadComponent('./input.tsx');
const { TextArea }: typeof import('./textarea') = await loadComponent('./textarea.tsx', {
  '@kobalte/core/text-field': primitives,
});
const { Tag }: typeof import('./tag') = await loadComponent('./tag.tsx');
const { CardTitle }: typeof import('./card') = await loadComponent('./card.tsx');
const { DeleteButton }: typeof import('./delete-button') = await loadComponent(
  './delete-button.tsx',
  { '~/components/ui/button': primitives },
);
const { CopyButton }: typeof import('./message/copy-button') = await loadComponent(
  './message/copy-button.tsx',
  { '~/components/ui/button': primitives },
);
const { CommandDialog }: typeof import('./command') = await loadComponent('./command.tsx', {
  'cmdk-solid': primitives,
  '~/components/ui/dialog': primitives,
});
const { Thumbnail }: typeof import('./thumbnail') = await loadComponent('./thumbnail.tsx', {
  '~/components/ui/dialog': primitives,
});
const { SwitchControl }: typeof import('./switch') = await loadComponent('./switch.tsx', {
  '@kobalte/core/switch': primitives,
});
const { IconBadge }: typeof import('./icon-badge') = await loadComponent('./icon-badge.tsx', {
  '~/components/ui/tooltip': primitives,
  './badge': primitives,
});

const classOf = (html: string, tag: string) =>
  html
    .match(new RegExp(`<${tag}\\b[^>]*\\sclass="([^"]*)"`))?.[1]
    .trim()
    .split(/\s+/) ?? [];

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

describe('field borders', () => {
  // A border colour utility on the element would beat the focus and invalid rules of `.input`,
  // which sit in the earlier components layer.
  it('leaves the input border colour to the .input class', () => {
    expect(
      classOf(
        renderToString(() => Input({})),
        'input',
      ),
    ).toEqual(['input', 'input-md']);
  });

  it('leaves the textarea border colour to the .input class', () => {
    const classes = classOf(
      renderToString(() => TextArea({})),
      'textarea',
    );

    expect(classes).toContain('input');
    expect(classes.filter((name) => name.startsWith('border-'))).toEqual([]);
  });
});

describe('JSX passed as a prop', () => {
  // A compiled `icon={<Icon />}` is a getter that builds the element again on every read.
  function countedProps() {
    const built = { icon: 0, dropdown: 0 };
    const props = {
      href: '/chat',
      onClick: () => {},
      get icon() {
        built.icon++;
        return 'icon';
      },
      get dropdown() {
        built.dropdown++;
        return 'dropdown';
      },
    };
    return { built, props };
  }

  it('builds the icon and dropdown of a sidebar link once', () => {
    const { built, props } = countedProps();
    const html = renderToString(() => SidebarLinkItem(props));

    expect(html).toContain('<span>icon</span>');
    expect(html).toContain('>dropdown</div>');
    expect(built).toEqual({ icon: 1, dropdown: 1 });
  });

  it('builds the icon and dropdown of a sidebar button once', () => {
    const { built, props } = countedProps();
    const html = renderToString(() => SidebarItem(props));

    expect(html).toContain('<span>icon</span>');
    expect(html).toContain('>dropdown</div>');
    expect(built).toEqual({ icon: 1, dropdown: 1 });
  });

  it('builds the icon of a tag once', () => {
    const { built, props } = countedProps();
    const html = renderToString(() =>
      Tag({
        get icon() {
          return props.icon;
        },
        children: 'Label',
      }),
    );

    expect(html).toContain('icon');
    expect(built.icon).toBe(1);
  });
});

describe('caller classes', () => {
  it('override the variant classes of a tag', () => {
    const classes = classOf(
      renderToString(() => Tag({ variant: 'secondary', class: 'px-4 text-lg' })),
      'span',
    );

    expect(classes).toContain('px-4');
    expect(classes).toContain('text-lg');
    expect(classes).not.toContain('px-2');
    expect(classes).not.toContain('text-xs');
    // The text colour is a different property from the font size, so it stays.
    expect(classes).toContain('text-main');
  });

  it('reach the switch control but not its hidden input', () => {
    const html = renderToString(() => SwitchControl({ class: 'bg-danger' }));

    expect(classOf(html, 'div')).toContain('bg-danger');
    expect(classOf(html, 'input')).not.toContain('bg-danger');
  });
});

describe('accessible names', () => {
  it('names the icon-only delete button', () => {
    const render = (label?: string) =>
      renderToString(() => DeleteButton({ onClick: () => {}, label }));

    expect(render()).toContain('aria-label="Remove"');
    expect(render('Remove Daily Driver')).toContain('aria-label="Remove Daily Driver"');
  });

  it('names the icon-only copy button', () => {
    expect(renderToString(() => CopyButton({ text: 'Hello' }))).toContain(
      'aria-label="Copy to clipboard"',
    );
  });

  it('names the command menu dialog', () => {
    const html = renderToString(() => CommandDialog({ filter: () => 1, children: 'Commands' }));

    expect(html).toMatch(/<div [^>]*role="dialog"[^>]*aria-label="Command menu"/);
    expect(html).toContain('Commands');
  });

  it('names the thumbnail preview dialog after the image', () => {
    const html = renderToString(() => Thumbnail({ file: 'photo.png', alt: 'A photo' }));

    expect(html).toMatch(/<div [^>]*role="dialog"[^>]*aria-label="A photo"/);
  });

  it('renders card titles below the page heading level', () => {
    const html = renderToString(() => CardTitle({ children: 'Daily Driver' }));

    expect(html).toMatch(/^<h3 [^>]*>Daily Driver<\/h3>$/);
  });
});

describe('IconBadge', () => {
  it('falls back to the default variant icon when no variant is given', () => {
    expect(renderToString(() => IconBadge({}))).toContain('data-icon="free"');
  });

  it('renders the icon of the given variant', () => {
    expect(renderToString(() => IconBadge({ variant: 'vision' }))).toContain(
      'data-icon="vision"',
    );
  });
});
