import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { transformSync } from '@babel/core';
import { afterAll, afterEach, describe, expect, it, spyOn } from 'bun:test';
import { JsxEmit, ModuleKind, ScriptTarget, transpileModule } from 'typescript';

import type { ChatProps, SessionProps } from '~/types';

import type { SessionContextValue } from './session-provider';

const solid: typeof import('solid-js') = await import(
  import.meta.resolve('solid-js/dist/solid.js')
);
const directory = await mkdtemp(join(tmpdir(), 'laneway-session-provider-'));
afterAll(() => rm(directory, { recursive: true, force: true }));
const stubs = join(directory, 'stubs.mjs');
await Bun.write(
  stubs,
  `import { createSignal } from ${JSON.stringify(import.meta.resolve('solid-js/dist/solid.js'))};
export const [chats, setChats] = createSignal([]);
export const store = { get chats() { return chats(); } };
export const cancel = () => {};
`,
);

// Compile without a DOM, but keep client reactivity for loading state and context.
const source = (
  await Bun.file(new URL('./session-provider.tsx', import.meta.url)).text()
).replace(/(['"])(~\/[^'"]+)\1/g, (_match, quote) => `${quote}${stubs}${quote}`);
const jsx = transpileModule(source, {
  compilerOptions: {
    jsx: JsxEmit.Preserve,
    module: ModuleKind.ESNext,
    target: ScriptTarget.ESNext,
  },
}).outputText;
const compiled = transformSync(jsx, { presets: [['babel-preset-solid', { generate: 'ssr' }]] });
if (!compiled?.code) throw new Error('Failed to compile SessionProvider');
const code = compiled.code.replace(/from (['"])([^'"]+)\1/g, (_match, quote, name: string) => {
  const specifier = name === 'solid-js' ? 'solid-js/dist/solid.js' : name;
  return `from ${quote}${import.meta.resolve(specifier)}${quote}`;
});
const filename = join(directory, 'session-provider.mjs');
await Bun.write(filename, code);
const { SessionProvider, useSession }: typeof import('./session-provider') = await import(
  filename
);
const { setChats }: { setChats: (chats: Pick<ChatProps, 'id' | 'status'>[]) => void } =
  await import(stubs);

let dispose = () => {};
afterEach(() => {
  dispose();
  setChats([]);
});

function setup(session: () => SessionProps) {
  let context!: SessionContextValue;
  solid.createRoot((cleanup) => {
    dispose = cleanup;
    SessionProvider({
      get session() {
        return session();
      },
      get children() {
        context = useSession();
        return null;
      },
    });
  });
  return context;
}

describe('session loading state', () => {
  it('tracks chat status, missing chats and session changes', () => {
    const [session, setSession] = solid.createSignal<SessionProps>({
      id: 'session',
      title: 'Session',
      type: 'chat',
      created: 0,
      chats: ['missing', 'chat'],
    });
    const context = setup(session);
    expect(context.isLoading()).toBe(false);

    setChats([{ id: 'chat', status: 'loading' }]);
    expect(context.isLoading()).toBe(true);
    setChats([{ id: 'chat', status: 'idle' }]);
    expect(context.isLoading()).toBe(false);
    setChats([{ id: 'other', status: 'loading' }]);
    expect(context.isLoading()).toBe(false);

    setSession({ ...session(), chats: ['other'] });
    expect(context.isLoading()).toBe(true);
    setSession({ ...session(), chats: [] });
    expect(context.isLoading()).toBe(false);
  });

  it('does not allocate memos when loading state is read or updated', () => {
    const createMemo = spyOn(solid, 'createMemo');
    try {
      const context = setup(() => ({
        id: 'session',
        title: 'Session',
        type: 'chat',
        created: 0,
        chats: ['chat'],
      }));
      const allocations = createMemo.mock.calls.length;
      expect(createMemo).toHaveBeenCalled();

      for (let i = 0; i < 5; i++) {
        setChats([{ id: 'chat', status: i % 2 ? 'idle' : 'loading' }]);
        expect(context.isLoading()).toBe(i % 2 === 0);
        expect(context.isLoading()).toBe(i % 2 === 0);
      }

      expect(createMemo).toHaveBeenCalledTimes(allocations);
    } finally {
      createMemo.mockRestore();
    }
  });
});
