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

// The icons module only resolves under Vite, so stub it as src/test/setup.ts does for unit tests.
const stubIcons = `
  const { iconsMock } = await import(${file('../test/icons-mock.ts')});
  Bun.plugin({
    name: 'icons',
    setup(build) {
      build.module('~/components/icons/ui', () => ({ exports: iconsMock(), loader: 'object' }));
    },
  });
`;

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

type Observed = {
  step: string;
  /** Per session, the message count of each of its chats; null when the chat does not exist. */
  sessions: (number | null)[][];
  /** Whether each chat of the draft session exists. */
  draft: boolean[];
  library: { assistants: number; presets: number };
};

it('never shows an observer a half-applied session or preset action', async () => {
  const seen = await runInClientBuild<Observed[]>(`
    ${stubIcons}
    globalThis.fetch = async () => Response.json([]);
    const { createEffect, createRoot } = await import('solid-js');
    const { setStore, store } = await import(${file('./index.tsx')});
    const { setModels } = await import(${file('./models.ts')});
    const { addPreset } = await import(${file('./actions/presets.ts')});
    const { addMessageToSessionChats, deleteSession, newDraftSession } = await import(
      ${file('./actions/session-actions.ts')}
    );
    globalThis.window = { confirm: () => true };

    const model = { title: 'Model', creator: {}, created: 0, provider: [] };
    setModels([{ ...model, id: 'one' }, { ...model, id: 'two' }]);
    const twoChats = [
      { modelId: 'one', status: 'idle' },
      { modelId: 'two', status: 'idle' },
    ];
    setStore({
      sessions: [],
      chats: [],
      assistants: [],
      presets: [{ id: 'preset', type: 'chat', chats: twoChats }],
    });

    const seen = [];
    let step = 'start';
    createRoot(() => {
      createEffect(() => {
        const messages = (id) => store.chats.find((chat) => chat.id === id)?.messages.length;
        seen.push({
          step,
          sessions: store.sessions.map((session) => session.chats.map(messages)),
          draft: store.draftSession.chats.map((id) =>
            store.draftChats.some((chat) => chat.id === id),
          ),
          library: { assistants: store.assistants.length, presets: store.presets.length },
        });
      });
    });
    const during = (name, action) => {
      step = name;
      return action();
    };

    during('draft from a preset', () => newDraftSession({ type: 'preset', referenceId: 'preset' }));
    const sessionId = during('create', () =>
      addMessageToSessionChats({ id: 'first', role: 'user', content: 'Hello' }),
    );
    during('message', () =>
      addMessageToSessionChats({ id: 'second', role: 'user', content: 'Again' }, sessionId),
    );
    during('draft from a model', () => newDraftSession({ type: 'model', referenceId: 'one' }));
    during('delete', () => deleteSession(sessionId));
    during('add preset', () =>
      addPreset(
        {
          id: 'template',
          type: 'chat',
          chats: [
            { assistantId: 'writer', status: 'idle' },
            { assistantId: 'editor', status: 'idle' },
          ],
        },
        [
          { id: 'writer', title: 'Writer', modelId: 'one' },
          { id: 'editor', title: 'Editor', modelId: 'two' },
        ],
      ),
    );

    console.log(JSON.stringify(seen));
  `);

  const during = (step: string) => seen.filter((observed) => observed.step === step);
  const sessions = (step: string) => during(step).map((observed) => observed.sessions);

  // Every action was observed, so the checks below cannot pass by seeing nothing.
  expect([...new Set(seen.map((observed) => observed.step))]).toEqual([
    'start',
    'draft from a preset',
    'create',
    'message',
    'draft from a model',
    'delete',
    'add preset',
  ]);

  // A session never refers to a chat that does not exist yet, or no longer exists.
  expect(seen.flatMap((observed) => observed.sessions.flat())).not.toContain(null);
  expect(sessions('create').at(-1)).toEqual([[1, 1]]);
  expect(sessions('delete')).toEqual([[]]);

  // A message reaches all of a session's chats together.
  expect(sessions('message')).toEqual([[[2, 2]]]);

  // A new draft never refers to chats of the draft it replaced.
  expect(during('draft from a preset').map((observed) => observed.draft)).toEqual([
    [true, true],
  ]);
  expect(during('draft from a model').map((observed) => observed.draft)).toEqual([[true]]);

  // A preset arrives together with the assistants it imports.
  expect(during('add preset').map((observed) => observed.library)).toEqual([
    { assistants: 2, presets: 2 },
  ]);
});

it('publishes the model catalogue once per load, already tagged', async () => {
  const seen = await runInClientBuild<string[][]>(`
    const recent = Math.floor(Date.now() / 1000);
    const model = { title: 'Model', creator: {}, provider: [] };
    globalThis.fetch = async () =>
      Response.json([
        { ...model, id: 'recent', created: recent },
        { ...model, id: 'old', created: 0, tags: ['new', 'free'] },
      ]);
    const { createEffect, createRoot } = await import('solid-js');
    const { fetchModels, models } = await import(${file('./models.ts')});
    // Importing the module starts a load of its own; this one finishes after it.
    await fetchModels();

    const seen = [];
    createRoot(() => {
      createEffect(() => seen.push(models.map((model) => (model.tags ?? ['untagged']).join())));
    });
    await fetchModels();

    console.log(JSON.stringify(seen));
  `);

  // The catalogue that was already loaded, then the reloaded one.
  expect(seen).toEqual([
    ['new', 'free'],
    ['new', 'free'],
  ]);
});
