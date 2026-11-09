import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { transformSync } from '@babel/core';
import { afterAll, afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from 'typescript';

import type { MessageProps } from '~/types';

const solid: typeof import('solid-js') = await import(
  import.meta.resolve('solid-js/dist/solid.js')
);
const directory = await mkdtemp(join(tmpdir(), 'laneway-multichat-layout-'));
afterAll(() => rm(directory, { recursive: true, force: true }));
const stubs = join(directory, 'stubs.mjs');
await Bun.write(
  stubs,
  `export const handlers = {};
export const useNavigate = () => (href) => handlers.navigate(href);
export const createMessage = (...args) => handlers.createMessage(...args);
export const setSessionInput = (...args) => handlers.setSessionInput(...args);
export const addMessageToSessionChats = (...args) => handlers.addMessageToSessionChats(...args);
const session = (id) => ({ id, title: id, type: 'chat', created: 0, chats: [], input: 'Hello' });
export const store = {
  sessions: [session('first'), session('second')],
  chats: [],
  draftSession: session('draft'),
  draftChats: [],
  settings: { generateTitles: false },
  speedDial: [],
};
export const selectSessionById = (id) => () => store.sessions.find((s) => s.id === id());
export const anyKeysSet = () => true;
export const useSession = () => ({ isLoading: () => false, cancelChats: () => {} });
export let chatInput;
export const ChatInput = (props) => { chatInput = props; return null; };
const nothing = () => null;
export const ChatPanel = nothing, StarterPrompts = nothing, KeyNotice = nothing,
  SpeedDial = nothing, requestApiKey = nothing, autonameChat = nothing;
`,
);

// Compile without a DOM and stub everything but Solid, to drive the composer's submit handler.
const source = (
  await Bun.file(new URL('./multichat-layout.tsx', import.meta.url)).text()
).replace(/from '([^']+)';/g, (statement, name: string) =>
  name === 'solid-js' ? statement : `from '${stubs}';`,
);
const jsx = transpileModule(source, {
  compilerOptions: {
    jsx: JsxEmit.Preserve,
    module: ModuleKind.ESNext,
    target: ScriptTarget.ESNext,
  },
}).outputText;
const compiled = transformSync(jsx, { presets: [['babel-preset-solid', { generate: 'ssr' }]] });
if (!compiled?.code) throw new Error('Failed to compile MultiChatLayout');
const code = compiled.code.replace(/from (['"])([^'"]+)\1/g, (_match, quote, name: string) => {
  if (name === stubs) return `from ${quote}${name}${quote}`;
  const specifier = name === 'solid-js' ? 'solid-js/dist/solid.js' : name;
  return `from ${quote}${import.meta.resolve(specifier)}${quote}`;
});
const filename = join(directory, 'multichat-layout.mjs');
await Bun.write(filename, code);
const { MultiChatLayout }: typeof import('./multichat-layout') = await import(filename);
const stubbed: {
  handlers: Record<string, (...args: never[]) => unknown>;
  chatInput: { onSubmit: () => Promise<void> };
} = await import(stubs);

const sent: MessageProps = { id: 'message', role: 'user', content: 'Hello' };
let dispose = () => {};
let message: PromiseWithResolvers<MessageProps>;
const createMessage = mock(() => message.promise);
const setSessionInput = mock<(input: string, sessionId?: string) => void>(() => {});
const addMessageToSessionChats = mock<(message: MessageProps, sessionId?: string) => string>(
  () => 'created',
);
const navigate = mock<(href: string) => void>(() => {});

/** Renders the layout on a route and returns a way to move to another one. */
function setup(route?: string) {
  const [sessionId, setSessionId] = solid.createSignal(route);
  solid.createRoot((cleanup) => {
    dispose = cleanup;
    MultiChatLayout({
      get sessionId() {
        return sessionId();
      },
    });
  });
  return setSessionId;
}

beforeEach(() => {
  message = Promise.withResolvers<MessageProps>();
  for (const fn of [createMessage, setSessionInput, addMessageToSessionChats, navigate]) {
    fn.mockClear();
  }
  Object.assign(stubbed.handlers, {
    createMessage,
    setSessionInput,
    addMessageToSessionChats,
    navigate,
  });
});

afterEach(() => dispose());

describe('MultiChatLayout submission', () => {
  it('sends to the session the message was written in when the route changes meanwhile', async () => {
    const setRoute = setup('first');

    const pending = stubbed.chatInput.onSubmit();
    expect(createMessage).toHaveBeenCalledTimes(1);
    setRoute('second');
    message.resolve(sent);
    await pending;

    expect(setSessionInput.mock.calls).toEqual([['', 'first']]);
    expect(addMessageToSessionChats.mock.calls).toEqual([[sent, 'first']]);
    expect(navigate).not.toHaveBeenCalled();
  });

  it('creates and opens the new chat when a draft is sent and the route changes meanwhile', async () => {
    const setRoute = setup();

    const pending = stubbed.chatInput.onSubmit();
    setRoute('second');
    message.resolve(sent);
    await pending;

    expect(setSessionInput.mock.calls).toEqual([['', undefined]]);
    expect(addMessageToSessionChats.mock.calls).toEqual([[sent, undefined]]);
    expect(navigate.mock.calls).toEqual([['/session/created']]);
  });
});
