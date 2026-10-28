import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { transformSync } from '@babel/core';
import { afterAll, describe, expect, it } from 'bun:test';
import type { Component } from 'solid-js';
import { renderToString } from 'solid-js/web';
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from 'typescript';

import type { MessageProps } from '~/types';

const directory = await mkdtemp(join(tmpdir(), 'laneway-message-'));
afterAll(() => rm(directory, { recursive: true, force: true }));
const stubs = join(directory, 'stubs.mjs');
await Bun.write(
  stubs,
  `export default (props) => props.text;
export const store = { settings: { messages: { showAvatars: false, showModelTitle: false } } };
export const apiKeys = {};
export const createAudio = () => ({});
export const ModelIcon = () => null;
export const IconBan = ModelIcon, IconUser = ModelIcon, Avatar = ModelIcon, Tag = ModelIcon,
  Lightbox = ModelIcon, LocalImage = ModelIcon, AudioButton = ModelIcon, CopyButton = ModelIcon,
  StatsPopover = ModelIcon, Tooltip = ModelIcon, TooltipContent = ModelIcon, TooltipTrigger = ModelIcon;
`,
);

// Compile Solid JSX for SSR and stub UI/services to isolate when message text appears.
const source = (await Bun.file(new URL('./message.tsx', import.meta.url)).text()).replace(
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
if (!compiled?.code) throw new Error('Failed to compile Message');
const code = compiled.code.replace(/from (['"])([^'"]+)\1/g, (_match, quote, name: string) => {
  return `from ${quote}${import.meta.resolve(name)}${quote}`;
});
const filename = join(directory, 'message.mjs');
await Bun.write(filename, code);
const { Message }: { Message: Component<MessageProps> } = await import(filename);

describe('Message', () => {
  it.each(['user', 'assistant'] as const)('renders %s text synchronously', (role) => {
    const html = renderToString(() => Message({ id: 'text', role, content: 'Hello there' }));

    expect(html).toContain('Hello there');
  });

  it.each(['user', 'assistant'] as const)('renders %s text parts synchronously', (role) => {
    const html = renderToString(() =>
      Message({
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
});
