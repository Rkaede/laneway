import type { PGlite } from '@electric-sql/pglite';
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import type { ChatProps, MessageProps, SessionProps } from '~/types';

import { createDatabase } from './create';
import {
  createDatabaseSync,
  DataReplacedError,
  loadMessages,
  newGeneration,
  readGeneration,
  type SyncState,
} from './sync';

let db: PGlite;

beforeEach(async () => {
  db = await createDatabase();
});

afterEach(() => db.close());

const message = (id: string, text = id, image?: string): MessageProps => ({
  id,
  role: 'user',
  content: image
    ? [
        { type: 'text', text },
        { type: 'image', image: { filename: 'a.png', storageId: image } },
      ]
    : text,
});

function session(
  id: string,
  chatIds: string[],
  extra: Partial<SessionProps> = {},
): SessionProps {
  return {
    id,
    title: `Title ${id}`,
    type: 'chat',
    created: 1,
    chats: chatIds,
    input: '',
    ...extra,
  };
}

const chat = (
  id: string,
  messages: MessageProps[],
  extra: Partial<ChatProps> = {},
): ChatProps => ({
  id,
  status: 'idle',
  modelId: 'model',
  messages,
  ...extra,
});

/** A sync bound to a mutable state, as the store binds it. */
function setup(initial: SyncState) {
  const state = { current: initial };
  const sync = createDatabaseSync({
    getDatabase: async () => db,
    getState: () => state.current,
  });
  return { state, sync };
}

const count = async (table: string) =>
  Number((await db.query<{ n: number }>(`select count(*) as n from ${table}`)).rows[0].n);

describe('sync', () => {
  it('writes the store, then writes nothing when it has not changed', async () => {
    const { sync } = setup({
      sessions: [session('s1', ['c1', 'c2'])],
      chats: [chat('c1', [message('m1'), message('m2')]), chat('c2', [message('m3')])],
    });
    expect((await sync.sync()).wrote).toBe(true);
    expect([await count('sessions'), await count('chats'), await count('messages')]).toEqual([
      1, 2, 3,
    ]);
    expect(sync.plan()).toMatchObject({ sessions: [], chats: [], messages: new Map() });
    expect((await sync.sync()).wrote).toBe(false);
  });

  it('writes only the messages that changed, and removes replaced ones', async () => {
    const { state, sync } = setup({
      sessions: [session('note', ['c1'], { type: 'note' })],
      chats: [chat('c1', [message('m1', 'first draft')])],
    });
    await sync.sync();

    // A note replaces its single message on every save.
    state.current = { ...state.current, chats: [chat('c1', [message('m2', 'second draft')])] };
    const plan = sync.plan();
    expect(plan.messages.get('c1')?.rows.map(({ row }) => row.id)).toEqual(['m2']);
    await sync.sync();
    const loaded = await loadMessages(db, ['c1']);
    expect(loaded.get('c1')?.map((item) => item.content)).toEqual(['second draft']);
  });

  it('never rewrites the messages of a chat that is not loaded', async () => {
    const { state, sync } = setup({
      sessions: [session('s1', ['c1'])],
      chats: [chat('c1', [message('m1')])],
    });
    await sync.sync();
    state.current = { ...state.current, chats: [chat('c1', [], { unloaded: true })] };
    await sync.sync();
    expect(await count('messages')).toBe(1);
  });

  it('deletes sessions and reports images no other chat uses', async () => {
    const { state, sync } = setup({
      sessions: [session('s1', ['c1']), session('s2', ['c2'])],
      chats: [
        chat('c1', [message('m1', 'a', 'only-here'), message('m2', 'b', 'shared')]),
        chat('c2', [message('m3', 'c', 'shared')]),
      ],
    });
    await sync.sync();
    state.current = { sessions: [state.current.sessions[1]], chats: [state.current.chats[1]] };
    const result = await sync.sync();
    expect(result.orphanedImages).toEqual(['only-here']);
    expect([await count('sessions'), await count('chats'), await count('messages')]).toEqual([
      1, 1, 1,
    ]);
  });

  it('keeps an image a fork shares until the last copy is deleted', async () => {
    const parent = chat('parent-chat', [message('p1', 'a', 'shared')]);
    const fork = chat('fork-chat', [message('f1', 'a', 'shared')]);
    const { state, sync } = setup({
      sessions: [session('parent', ['parent-chat']), session('fork', ['fork-chat'])],
      chats: [parent, fork],
    });
    await sync.sync();

    state.current = { sessions: [session('fork', ['fork-chat'])], chats: [fork] };
    expect((await sync.sync()).orphanedImages).toEqual([]);
    state.current = { sessions: [], chats: [] };
    expect((await sync.sync()).orphanedImages).toEqual(['shared']);
  });

  it('only deletes sessions this tab knew about', async () => {
    const tabA = setup({
      sessions: [session('a', ['ca'])],
      chats: [chat('ca', [message('ma')])],
    });
    await tabA.sync.sync();
    const tabB = setup({
      sessions: [session('b', ['cb'])],
      chats: [chat('cb', [message('mb')])],
    });
    await tabB.sync.sync();

    tabA.state.current = { sessions: [], chats: [] };
    await tabA.sync.sync();
    const { rows } = await db.query<{ id: string }>('select id from sessions');
    expect(rows.map((row) => row.id)).toEqual(['b']);
  });
});

describe('prime', () => {
  it('skips unchanged rows, returns sessions missing from the store and applies deletes', async () => {
    const first = setup({
      sessions: [
        session('kept', ['c1']),
        session('other-tab', ['c2']),
        session('deleted', ['c3']),
      ],
      chats: [
        chat('c1', [message('m1')]),
        chat('c2', [message('m2')]),
        chat('c3', [message('m3')]),
      ],
    });
    await first.sync.sync();

    // A reload: the snapshot only has `kept`, with its messages stripped.
    const reloaded = setup({
      sessions: [session('kept', ['c1'])],
      chats: [chat('c1', [], { unloaded: true })],
    });
    const missing = await reloaded.sync.prime(['deleted']);
    expect(missing.sessions.map((item) => item.id)).toEqual(['other-tab']);
    expect(missing.chats).toEqual([
      expect.objectContaining({
        id: 'c2',
        sessionId: 'other-tab',
        messages: [],
        unloaded: true,
      }),
    ]);

    reloaded.state.current = {
      sessions: [...reloaded.state.current.sessions, ...missing.sessions],
      chats: [...reloaded.state.current.chats, ...missing.chats],
    };
    const plan = reloaded.sync.plan();
    expect(plan).toMatchObject({ deleteSessions: ['deleted'], sessions: [], chats: [] });
    await reloaded.sync.sync();
    expect(await count('messages')).toBe(2);
  });

  it('reads the saved messages of loaded chats, so they are not written again', async () => {
    const initial = { sessions: [session('s1', ['c1'])], chats: [chat('c1', [message('m1')])] };
    await setup(initial).sync.sync();
    const reloaded = setup(initial);
    await reloaded.sync.prime();
    expect(reloaded.sync.plan().messages.size).toBe(0);
    expect(reloaded.sync.isPersisted(initial.chats[0])).toBe(true);
  });
});

describe('isPersisted and pendingDeletes', () => {
  it('track what the database holds', async () => {
    const { state, sync } = setup({
      sessions: [session('s1', ['c1'])],
      chats: [chat('c1', [message('m1')])],
    });
    expect(sync.isPersisted(state.current.chats[0])).toBe(false);
    await sync.sync();
    expect(sync.isPersisted(state.current.chats[0])).toBe(true);
    expect(sync.isPersisted(chat('c1', [message('m1'), message('m2')]))).toBe(false);
    expect(sync.pendingDeletes({ sessions: [], chats: [] })).toEqual(['s1']);
  });
});

describe('generations', () => {
  it('refuses to save a store read before the data was replaced', async () => {
    const { state, sync } = setup({
      sessions: [session('s1', ['c1'])],
      chats: [chat('c1', [])],
    });
    sync.setGeneration(null);
    await sync.sync();

    const replaced = await db.transaction((tx) => newGeneration(tx));
    expect(await readGeneration(db)).toBe(replaced);
    state.current = { sessions: [], chats: [] };

    expect(sync.sync()).rejects.toBeInstanceOf(DataReplacedError);
    expect(await count('sessions')).toBe(1);

    sync.setGeneration(replaced);
    expect((await sync.sync()).wrote).toBe(true);
    expect(await count('sessions')).toBe(0);
  });

  it('tells the store when a background save finds the data replaced', async () => {
    const { sync } = setup({ sessions: [session('s1', [])], chats: [] });
    sync.setGeneration('old');
    let replaced = 0;
    sync.start(() => {}, { replaced: () => replaced++ });
    sync.schedule();
    await Bun.sleep(400);
    expect(replaced).toBe(1);
    expect(await count('sessions')).toBe(0);
  });
});

describe('repeated ids', () => {
  it('saves a session or chat the store lists twice once, rather than failing every sync', async () => {
    const first = session('s', ['c']);
    const { sync } = setup({
      sessions: [first, { ...first }],
      chats: [chat('c', [message('m')]), chat('c', [message('m')])],
    });

    expect((await sync.sync()).wrote).toBe(true);
    const { rows } = await db.query<{ count: number }>(
      'select count(*)::int as count from chats',
    );
    expect(rows[0].count).toBe(1);
    expect((await loadMessages(db, ['c'])).get('c')).toEqual([message('m')]);
  });
});
