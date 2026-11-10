import { expect, it } from 'bun:test';

// `bun test` loads Solid's server build, where a store is a plain object, `batch` only calls its
// callback and effects never run. These tests need the client build, so each one runs a script in
// a browser-conditioned process, as src/tinykeys.test.ts does.
async function runInClientBuild<T>(script: string): Promise<T> {
  const child = Bun.spawn([process.execPath, '--conditions=browser', '--eval', script], {
    cwd: import.meta.dir,
    stdout: 'pipe',
    stderr: 'pipe',
  });
  const [exitCode, stdout, stderr] = await Promise.all([
    child.exited,
    new Response(child.stdout).text(),
    new Response(child.stderr).text(),
  ]);

  expect(exitCode, stderr).toBe(0);
  return JSON.parse(stdout);
}

const file = (path: string) => JSON.stringify(new URL(path, import.meta.url).href);

it('serialises the raw state to the same bytes as serialising through the store', async () => {
  const result = await runInClientBuild<Record<string, boolean>>(`
    const { $PROXY } = await import('solid-js');
    const { createStore } = await import('solid-js/store');
    const { serializeChatStore } = await import(${file('./chat-persistence.ts')});
    const { createDefaultState } = await import(${file('./default-state.ts')});

    const throughProxies = (state) =>
      JSON.stringify({ ...state, dialogs: undefined }, (key, value) =>
        key === 'controller' ? undefined : value,
      );
    const example = () => {
      const state = createDefaultState();
      state.sessions.push({
        id: 'session',
        title: 'Compare',
        type: 'chat',
        created: 1,
        chats: ['streaming', 'answered'],
      });
      state.chats.push(
        {
          id: 'streaming',
          status: 'loading',
          controller: new AbortController(),
          latest: { role: 'assistant', content: 'Partial answer' },
          messages: [
            {
              id: 'question',
              role: 'user',
              content: [
                { type: 'text', text: 'Describe this image' },
                { type: 'image', image: { filename: 'photo.png', storageId: 'photo' } },
              ],
            },
          ],
        },
        {
          id: 'answered',
          status: 'idle',
          messages: [{ id: 'answer', role: 'assistant', content: 'A photo', usage: {} }],
        },
      );
      state.draftChats[0].controller = new AbortController();
      state.dialogs.about.open = true;
      return state;
    };

    const raw = example();
    const [store] = createStore(raw);
    const serialized = serializeChatStore(store);
    // Reading a nested object through the store wraps it in a proxy, which marks the raw object.
    const wrappedNestedState = $PROXY in raw.chats;
    const plain = example();

    console.log(
      JSON.stringify({
        wrappedNestedState,
        storeMatches: serialized === throughProxies(store),
        plainObjectMatches: serializeChatStore(plain) === throughProxies(plain),
        omitsRuntimeState: !/"(controller|dialogs)"/.test(serialized),
      }),
    );
  `);

  expect(result).toEqual({
    wrappedNestedState: false,
    storeMatches: true,
    plainObjectMatches: true,
    omitsRuntimeState: true,
  });
});
