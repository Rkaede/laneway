import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { transformSync } from '@babel/core';
import { afterAll, describe, expect, it } from 'bun:test';
import type { Component } from 'solid-js';
import { renderToString } from 'solid-js/web';
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from 'typescript';

import type { ModelProps } from '~/types';

import type { MessageViewProps } from './message-view';

const directory = await mkdtemp(join(tmpdir(), 'laneway-message-'));
afterAll(() => rm(directory, { recursive: true, force: true }));
const stubs = join(directory, 'stubs.mjs');
await Bun.write(
  stubs,
  `export default (props) => props.text;
export const ModelIcon = () => null;
export const IconBan = ModelIcon, IconUser = ModelIcon, Avatar = ModelIcon, Tag = ModelIcon,
  Lightbox = ModelIcon, LocalImage = ModelIcon, AudioButton = ModelIcon, CopyButton = ModelIcon,
  StatsPopover = ModelIcon, Tooltip = ModelIcon, TooltipContent = ModelIcon, TooltipTrigger = ModelIcon;
`,
);

// Compile Solid JSX for SSR and stub UI/services to isolate when message text appears.
const source = (await Bun.file(new URL('./message-view.tsx', import.meta.url)).text()).replace(
  /(['"])(~\/[^'"]+)\1/g,
  (_match, quote, name: string) => {
    const specifier =
      name === '~/util' ? new URL('../../../util.ts', import.meta.url).href : stubs;
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
if (!compiled?.code) throw new Error('Failed to compile MessageView');
const code = compiled.code.replace(/from (['"])([^'"]+)\1/g, (_match, quote, name: string) => {
  return `from ${quote}${import.meta.resolve(name)}${quote}`;
});
const filename = join(directory, 'message-view.mjs');
await Bun.write(filename, code);
const { MessageView }: { MessageView: Component<MessageViewProps> } = await import(filename);

describe('MessageView', () => {
  it.each(['user', 'assistant'] as const)('renders %s text synchronously', (role) => {
    const html = renderToString(() =>
      MessageView({ id: 'text', role, content: 'Hello there' }),
    );

    expect(html).toContain('Hello there');
  });

  it.each(['user', 'assistant'] as const)('renders %s text parts synchronously', (role) => {
    const html = renderToString(() =>
      MessageView({
        id: 'parts',
        role,
        content: [
          { type: 'text', text: 'First part' },
          { type: 'text', text: 'Second part' },
        ],
      }),
    );

    expect(html).toContain('First part');
    expect(html).toContain('Second part');
  });

  it('shows the model title only when asked to', () => {
    const message = {
      id: 'title',
      role: 'assistant',
      content: 'Hello',
      model: { title: 'Test Model' } as ModelProps,
    } as const;

    expect(renderToString(() => MessageView({ ...message, showModelTitle: true }))).toContain(
      'Test Model',
    );
    expect(renderToString(() => MessageView(message))).not.toContain('Test Model');
  });
});
