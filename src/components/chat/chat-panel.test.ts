import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { transformSync } from '@babel/core';
import { afterAll, describe, expect, it } from 'bun:test';
import type { Component } from 'solid-js';
import { renderToString } from 'solid-js/web';
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from 'typescript';

import type { ChatProps } from '~/types';

// Compile Solid JSX for Bun and stub dependencies unrelated to the panel's loading state.
const source = (await Bun.file(new URL('./chat-panel.tsx', import.meta.url)).text()).replace(
  /import .* from '([^']+)';/g,
  (statement, name: string) => (name === 'solid-js' ? statement : ''),
);
const jsx = transpileModule(
  `
  const useNavigate = () => () => {};
  const Loader = () => '[loader]';
  const createAnimatedText = (text) => ({ animatedText: text });
  const useChat = () => ({
    assistant: () => undefined,
    model: () => undefined,
    provider: () => undefined,
    isApiKeyConfigured: () => true,
  });
  const store = { settings: { tts: { enabled: false } } };
  const Chatbar = () => null;
  const AlertApiKey = () => null;
  const AlertError = () => null;
  const AlertNoVision = () => null;
  const Message = (props) => props.content;
  ${source}
  `,
  {
    compilerOptions: {
      jsx: JsxEmit.Preserve,
      module: ModuleKind.ESNext,
      target: ScriptTarget.ESNext,
    },
  },
).outputText;
const compiled = transformSync(jsx, { presets: [['babel-preset-solid', { generate: 'ssr' }]] });
if (!compiled?.code) throw new Error('Failed to compile ChatPanel');
const code = compiled.code.replace(/from (['"])([^'"]+)\1/g, (_match, quote, name: string) => {
  return `from ${quote}${import.meta.resolve(name)}${quote}`;
});
const directory = await mkdtemp(join(tmpdir(), 'laneway-chat-panel-'));
afterAll(() => rm(directory, { recursive: true, force: true }));
const filename = join(directory, 'chat-panel.mjs');
await Bun.write(filename, code);
const { ChatPanel }: { ChatPanel: Component<{ sessionId: string; chat: ChatProps }> } =
  await import(filename);
const render = (chat: Partial<ChatProps>) =>
  renderToString(() =>
    ChatPanel({
      sessionId: 'session',
      chat: { id: 'chat', messages: [], status: 'idle', ...chat },
    }),
  );

describe('ChatPanel loading indicator', () => {
  it('shows the loader while waiting for the first response content', () => {
    expect(render({ status: 'loading' })).toContain('[loader]');
  });

  it('keeps the loader for an empty incoming response', () => {
    expect(
      render({ status: 'loading', latest: { id: 'reply', role: 'assistant', content: '' } }),
    ).toContain('[loader]');
  });

  it('hides the loader once response text starts streaming', () => {
    const html = render({
      status: 'loading',
      latest: { id: 'reply', role: 'assistant', content: 'Partial response' },
    });

    expect(html).toContain('Partial response');
    expect(html).not.toContain('[loader]');
  });

  it.each(['idle', 'error', 'canceled'] as const)('hides the loader when %s', (status) => {
    expect(render({ status })).not.toContain('[loader]');
  });
});
