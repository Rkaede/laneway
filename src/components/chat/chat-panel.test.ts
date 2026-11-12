import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { transformSync } from '@babel/core';
import { afterAll, afterEach, describe, expect, it } from 'bun:test';
import type { Component } from 'solid-js';
import { renderToString } from 'solid-js/web';
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from 'typescript';

import type { ChatProps } from '~/types';

// Compile Solid JSX for Bun and stub dependencies unrelated to the panel's loading state.
const kept = new Set([
  'solid-js',
  '~/constants',
  '~/services/stream-display',
  '~/services/stream-trials',
]);
const source = (await Bun.file(new URL('./chat-panel.tsx', import.meta.url)).text()).replace(
  /import [^;]* from '([^']+)';/g,
  (statement, name: string) => (kept.has(name) ? statement : ''),
);
const jsx = transpileModule(
  `
  const anyKeysSet = () => true;
  const modelsLoaded = () => true;
  const requestApiKey = () => {};
  const Loader = () => '[loader]';
  const StreamCursor = (props) => '[cursor:' + props.shape + ']';
  const useChat = () => ({
    assistant: () => undefined,
    model: () => ({ id: 'test-model' }),
    isApiKeyConfigured: () => true,
  });
  const store = { settings: { tts: { enabled: false }, streaming: { display: 'live', cursor: 'dots' } } };
  export const setDisplay = (display) => { store.settings.streaming.display = display; };
  export const setCursor = (cursor) => { store.settings.streaming.cursor = cursor; };
  const createStreamFollow = () => ({
    following: () => true,
    away: () => false,
    jump: () => {},
    revealFromStart: () => {},
  });
  const prefersReducedMotion = () => false;
  // Shows every finished unit at once, as the real hook does once it has caught up.
  const createPacedText = (text, pacing) => () => {
    const pace = pacing();
    return pace ? text().slice(0, pace.ends(text()).at(-1) ?? 0) : text();
  };
  const createStreamReveal = () => ({ wordSpans: () => false });
  const JumpToLatest = () => '[jump]';
  const Chatbar = () => null;
  const AlertApiKey = () => null;
  const AlertError = () => null;
  const AlertNoVision = () => null;
  const ForkDialog = () => null;
  const BranchNotice = () => null;
  const Message = (props) =>
    props.content +
    '[model:' + (props.model?.id ?? 'none') + '][status:' + props.status + ']' +
    (props.cursor ? '[trailing-cursor:' + props.cursor + ']' : '');
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
const {
  ChatPanel,
  setCursor,
  setDisplay,
}: {
  ChatPanel: Component<{ chat: ChatProps }>;
  setCursor: (cursor: string) => void;
  setDisplay: (display: string) => void;
} = await import(filename);
const render = (chat: Partial<ChatProps>) =>
  renderToString(() =>
    ChatPanel({
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
      latest: { id: 'reply', role: 'assistant', content: 'Partial response and more' },
    });

    expect(html).toContain('Partial response');
    expect(html).not.toContain('[loader]');
  });

  it.each(['idle', 'error', 'canceled'] as const)('hides the loader when %s', (status) => {
    expect(render({ status })).not.toContain('[loader]');
  });
});

describe('ChatPanel streaming cursor setting', () => {
  afterEach(() => setCursor('dots'));

  it.each(['square', 'circle'] as const)('shows a %s cursor in place of the dots', (shape) => {
    setCursor(shape);
    const html = render({ status: 'loading' });

    expect(html).toContain(`[cursor:${shape}]`);
    expect(html).not.toContain('[loader]');
  });

  it('moves the cursor to the end of the text once the response starts streaming', () => {
    setCursor('square');
    const html = render({
      status: 'loading',
      latest: { id: 'reply', role: 'assistant', content: 'Partial response and more' },
    });

    expect(html).not.toContain('[cursor:');
    expect(html).toContain('[trailing-cursor:square]');
  });

  it('gives the streaming message no cursor when the cursor is dots', () => {
    const html = render({
      status: 'loading',
      latest: { id: 'reply', role: 'assistant', content: 'Partial response and more' },
    });

    expect(html).not.toContain('[trailing-cursor:');
  });

  it('falls back to the default cursor for a saved one it does not know', () => {
    setCursor('hologram');

    expect(render({ status: 'loading' })).toContain('[cursor:square]');
  });
});

describe('ChatPanel streaming display', () => {
  const streaming = {
    status: 'loading' as const,
    latest: {
      id: 'reply',
      role: 'assistant' as const,
      content: 'First paragraph.\n\nSecond is being wri',
    },
  };

  afterEach(() => setDisplay('live'));

  it('shows finished words by default and holds back the word being written', () => {
    const html = render(streaming);

    expect(html).toContain('Second is being[');
    expect(html).not.toContain('wri');
    expect(html).not.toContain('[loader]');
  });

  it('holds back an unfinished sentence when showing sentences', () => {
    setDisplay('sentences');
    const html = render({
      ...streaming,
      latest: { ...streaming.latest, content: 'One sentence. Another is being wri' },
    });

    expect(html).toContain('One sentence.[');
    expect(html).not.toContain('Another');
  });

  it('holds back an unfinished paragraph when buffering paragraphs', () => {
    setDisplay('paragraphs');
    const html = render(streaming);

    expect(html).toContain('First paragraph.');
    expect(html).not.toContain('Second is being wri');
  });

  it('keeps the loader until the first paragraph is finished', () => {
    setDisplay('paragraphs');

    expect(
      render({ ...streaming, latest: { ...streaming.latest, content: 'Still the first' } }),
    ).toContain('[loader]');
  });

  it('shows no text until the answer is complete and says it is still writing', () => {
    setDisplay('complete');
    const html = render(streaming);

    expect(html).not.toContain('First paragraph.');
    expect(html).toContain('[loader]');
    expect(html).toContain('Writing the answer');
  });

  it('shows no waiting note before any text has arrived', () => {
    setDisplay('complete');

    expect(render({ status: 'loading' })).not.toContain('Writing the answer');
  });

  it('shows finished messages whatever the display mode', () => {
    setDisplay('complete');
    const html = render({
      status: 'idle',
      messages: [{ id: 'done', role: 'assistant', content: 'A finished answer' }],
    });

    expect(html).toContain('A finished answer');
  });
});

describe('ChatPanel message model', () => {
  it('gives the streaming message the same model as finished messages', () => {
    const html = render({
      status: 'loading',
      messages: [{ id: 'done', role: 'assistant', content: 'Finished response' }],
      latest: { id: 'reply', role: 'assistant', content: 'Partial response and more' },
    });

    expect(html).toContain('Finished response[model:test-model]');
    expect(html).toContain('Partial response and[model:test-model]');
  });

  it('marks only the streaming message as loading, which hides its toolbar', () => {
    const html = render({
      status: 'loading',
      messages: [{ id: 'done', role: 'assistant', content: 'Finished response' }],
      latest: { id: 'reply', role: 'assistant', content: 'Partial response and more' },
    });

    expect(html).toContain('Finished response[model:test-model][status:undefined]');
    expect(html).toContain('Partial response and[model:test-model][status:loading]');
  });
});
