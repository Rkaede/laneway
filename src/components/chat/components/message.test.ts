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
export const LocalImage = (props) => '[image alt=' + props.alt + ']';
export const CopyButton = () => '[copy]';
export const IconBan = ModelIcon, IconUser = ModelIcon, Avatar = ModelIcon, Tag = ModelIcon,
  Lightbox = ModelIcon, AudioButton = ModelIcon, ForkButton = ModelIcon,
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

  it('names each image after its file', () => {
    const html = renderToString(() =>
      MessageView({
        id: 'images',
        role: 'user',
        content: [
          { type: 'image', image: { filename: 'holiday.png', storageId: 'first' } },
          { type: 'text', text: 'Two photos' },
          { type: 'image', image: { filename: 'receipt.jpg', storageId: 'second' } },
        ],
      }),
    );

    expect(html).toContain('[image alt=holiday.png]');
    expect(html).toContain('[image alt=receipt.jpg]');
  });

  it('shows the toolbar on a finished answer and hides it while the answer streams', () => {
    const message = { id: 'answer', role: 'assistant', content: 'Hello' } as const;

    expect(renderToString(() => MessageView(message))).toContain('[copy]');
    expect(renderToString(() => MessageView({ ...message, status: 'loading' }))).not.toContain(
      '[copy]',
    );
  });

  it('shows no toolbar on a message from the user', () => {
    const html = renderToString(() =>
      MessageView({ id: 'question', role: 'user', content: 'Hello' }),
    );

    expect(html).not.toContain('[copy]');
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
