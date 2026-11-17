import type { PGliteInterface, Transaction } from '@electric-sql/pglite';
import { nanoid } from 'nanoid';

import type { ChatProps, MessageProps, SessionProps } from '~/types';

import { IMAGE_PARTS, STORED_IMAGE } from './images';
import {
  chatFromRow,
  chatRow,
  messageRow,
  sessionFromRow,
  sessionRow,
  signature,
} from './rows';

export type SyncState = { sessions: SessionProps[]; chats: ChatProps[] };

type Signed<T> = { row: T; signature: number };

type Plan = {
  deleteSessions: string[];
  deleteChats: string[];
  sessions: Signed<ReturnType<typeof sessionRow>>[];
  chats: Signed<ReturnType<typeof chatRow>>[];
  /** Chats whose messages changed, with every message's signature after the write. */
  messages: Map<
    string,
    { rows: Signed<ReturnType<typeof messageRow>>[]; signatures: Map<string, number> }
  >;
};

export type SyncResult = {
  wrote: boolean;
  /** Images that only the deleted sessions used. The caller checks unsaved chats before removing them. */
  orphanedImages: string[];
};

const BATCH = 200;

/**
 * The `kv` key of the data's generation, which changes when a backup replaces everything. A store
 * read from before the change must not be saved over the new data.
 */
const GENERATION = 'generation';

export async function readGeneration(db: PGliteInterface | Transaction) {
  const { rows } = await db.query<{ value: string }>('select value from kv where key = $1', [
    GENERATION,
  ]);
  return rows[0]?.value ?? null;
}

/** Starts a new generation. Run in the transaction that replaces the data. */
export async function newGeneration(tx: Transaction) {
  const generation = nanoid();
  await tx.query(
    `insert into kv (key, value) values ($1, to_jsonb($2::text))
     on conflict (key) do update set value = excluded.value`,
    [GENERATION, generation],
  );
  return generation;
}

/** The data was replaced after this tab read its store, so the store must not be saved. */
export class DataReplacedError extends Error {
  constructor() {
    super('The data was replaced in another tab.');
  }
}

function messageSignatures(messages: MessageProps[]) {
  return new Map(
    messages.map((message, position) => [message.id, signature([position, message])]),
  );
}

/** Which session each chat belongs to, and where. Chats outside every session are not saved. */
function chatOwners(sessions: SessionProps[]) {
  const owners = new Map<string, { sessionId: string; position: number }>();
  for (const session of sessions) {
    session.chats.forEach((chatId, position) =>
      owners.set(chatId, { sessionId: session.id, position }),
    );
  }
  return owners;
}

async function upsert(
  tx: Transaction,
  table: string,
  columns: string[],
  rows: Record<string, unknown>[],
) {
  const updates = columns
    .filter((column) => column !== 'id')
    .map((column) => `${column} = excluded.${column}`)
    .join(', ');
  for (let start = 0; start < rows.length; start += BATCH) {
    const batch = rows.slice(start, start + BATCH);
    const values = batch.map(
      (_, row) =>
        `(${columns.map((_, column) => `$${row * columns.length + column + 1}`).join(', ')})`,
    );
    await tx.query(
      `insert into ${table} (${columns.join(', ')}) values ${values.join(', ')}
       on conflict (id) do update set ${updates}`,
      batch.flatMap((row) => columns.map((column) => row[column])),
    );
  }
}

/**
 * Keeps the database in step with the store. Each sync compares the store with what this tab last
 * wrote, and writes only the difference in one transaction. Deletes only cover sessions and chats
 * this tab knew about, so a sync never removes what another tab has just created.
 */
export function createDatabaseSync({
  getDatabase,
  getState,
  delay = 300,
}: {
  getDatabase: () => Promise<PGliteInterface>;
  getState: () => SyncState;
  delay?: number;
}) {
  /** The generation the store was read from. Unset, writes do not check it. */
  let generation: string | null | undefined;
  let onReplaced: (() => void) | undefined;
  const sessions = new Map<string, number>();
  const chats = new Map<string, number>();
  const messages = new Map<string, Map<string, number>>();
  let onSynced: ((result: SyncResult) => void) | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let running: Promise<SyncResult> | undefined;
  let again = false;

  function plan(state: SyncState): Plan {
    const sessionIds = new Set(state.sessions.map((session) => session.id));
    const chatIds = new Set(state.chats.map((chat) => chat.id));
    const result: Plan = {
      deleteSessions: [...sessions.keys()].filter((id) => !sessionIds.has(id)),
      deleteChats: [...chats.keys()].filter((id) => !chatIds.has(id)),
      sessions: [],
      chats: [],
      messages: new Map(),
    };

    for (const session of state.sessions) {
      const row = sessionRow(session);
      const rowSignature = signature(row);
      if (sessions.get(session.id) !== rowSignature) {
        result.sessions.push({ row, signature: rowSignature });
      }
    }

    const owners = chatOwners(state.sessions);
    for (const chat of state.chats) {
      const owner = owners.get(chat.id);
      if (!owner) continue;
      const row = chatRow(chat, owner.sessionId, owner.position);
      const rowSignature = signature(row);
      if (chats.get(chat.id) !== rowSignature)
        result.chats.push({ row, signature: rowSignature });

      if (chat.unloaded) continue;
      const known = messages.get(chat.id);
      const signatures = messageSignatures(chat.messages);
      const rows = chat.messages.flatMap((message, position) => {
        const messageSignature = signatures.get(message.id)!;
        if (known?.get(message.id) === messageSignature) return [];
        return [{ row: messageRow(message, chat.id, position), signature: messageSignature }];
      });
      if (!known || rows.length || known.size !== signatures.size) {
        result.messages.set(chat.id, { rows, signatures });
      }
    }
    return result;
  }

  async function apply(next: Plan): Promise<SyncResult> {
    const empty =
      !next.deleteSessions.length &&
      !next.deleteChats.length &&
      !next.sessions.length &&
      !next.chats.length &&
      !next.messages.size;
    if (empty) return { wrote: false, orphanedImages: [] };

    const db = await getDatabase();
    let orphanedImages: string[] = [];
    await db.transaction(async (tx) => {
      if (generation !== undefined && (await readGeneration(tx)) !== generation) {
        throw new DataReplacedError();
      }
      if (next.deleteSessions.length || next.deleteChats.length) {
        const { rows } = await tx.query<{ id: string }>(
          `select distinct part->'image'->>'storageId' as id
           from messages m join chats c on c.id = m.chat_id, ${IMAGE_PARTS}
           where (c.session_id = any($1) or c.id = any($2)) and ${STORED_IMAGE}`,
          [next.deleteSessions, next.deleteChats],
        );
        await tx.query('delete from sessions where id = any($1)', [next.deleteSessions]);
        await tx.query('delete from chats where id = any($1)', [next.deleteChats]);
        const candidates = rows.map((row) => row.id);
        if (candidates.length) {
          const stillUsed = await tx.query<{ id: string }>(
            `select distinct part->'image'->>'storageId' as id from messages m, ${IMAGE_PARTS}
             where ${STORED_IMAGE} and part->'image'->>'storageId' = any($1)`,
            [candidates],
          );
          const used = new Set(stillUsed.rows.map((row) => row.id));
          orphanedImages = candidates.filter((id) => !used.has(id));
        }
      }
      await upsert(
        tx,
        'sessions',
        ['id', 'type', 'title', 'created', 'data'],
        next.sessions.map(({ row }) => row),
      );
      await upsert(
        tx,
        'chats',
        ['id', 'session_id', 'position', 'data'],
        next.chats.map(({ row }) => row),
      );
      for (const [chatId, change] of next.messages) {
        await upsert(
          tx,
          'messages',
          ['id', 'chat_id', 'position', 'data'],
          change.rows.map(({ row }) => row),
        );
        await tx.query('delete from messages where chat_id = $1 and not (id = any($2))', [
          chatId,
          [...change.signatures.keys()],
        ]);
      }
    });
    // The database runs with relaxed durability, so a commit can return before IndexedDB has the
    // data. Wait for it before recording rows as saved, because the snapshot then drops them.
    await db.syncToFs();

    for (const id of next.deleteSessions) sessions.delete(id);
    for (const id of next.deleteChats) {
      chats.delete(id);
      messages.delete(id);
    }
    for (const { row, signature: rowSignature } of next.sessions)
      sessions.set(row.id, rowSignature);
    for (const { row, signature: rowSignature } of next.chats) chats.set(row.id, rowSignature);
    for (const [chatId, change] of next.messages) messages.set(chatId, change.signatures);
    return { wrote: true, orphanedImages };
  }

  /** Writes the store's changes now. Calls made while a sync runs share one follow-up sync. */
  async function sync(): Promise<SyncResult> {
    if (running) {
      again = true;
      return running;
    }
    running = (async () => {
      const results: SyncResult[] = [];
      do {
        again = false;
        results.push(await apply(plan(getState())));
      } while (again);
      return {
        wrote: results.some((result) => result.wrote),
        orphanedImages: results.flatMap((result) => result.orphanedImages),
      };
    })();
    try {
      return await running;
    } finally {
      running = undefined;
    }
  }

  return {
    plan: () => plan(getState()),
    sync,

    /**
     * Reads what the database holds, so unchanged rows are not written again, and returns the
     * sessions and chats that are in the database but not in `state`, the store by default.
     * `deleted` lists sessions removed before the last sync could save that, which the first sync
     * then deletes.
     */
    async prime(deleted: string[] = [], state: SyncState = getState()) {
      const db = await getDatabase();
      const [sessionRows, chatRows] = await Promise.all([
        db.query<ReturnType<typeof sessionRow>>(
          'select id, type, title, created, data from sessions',
        ),
        db.query<ReturnType<typeof chatRow>>(
          'select id, session_id, position, data from chats order by session_id, position',
        ),
      ]);
      const loaded = state.chats.filter((chat) => !chat.unloaded).map((chat) => chat.id);
      const messageRows = await db.query<{
        chat_id: string;
        id: string;
        position: number;
        data: MessageProps;
      }>(
        'select chat_id, id, position, data from messages where chat_id = any($1) order by position',
        [loaded],
      );

      for (const row of sessionRows.rows) sessions.set(row.id, signature(row));
      for (const row of chatRows.rows) chats.set(row.id, signature(row));
      for (const row of messageRows.rows) {
        const known = messages.get(row.chat_id) ?? new Map<string, number>();
        known.set(row.id, signature([row.position, row.data]));
        messages.set(row.chat_id, known);
      }

      const inStore = new Set(state.sessions.map((session) => session.id));
      const skip = new Set(deleted);
      const missing = sessionRows.rows.filter(
        (row) => !inStore.has(row.id) && !skip.has(row.id),
      );
      const missingIds = new Set(missing.map((row) => row.id));
      const missingChats = chatRows.rows.filter((row) => missingIds.has(row.session_id));
      return {
        sessions: missing.map((row) =>
          sessionFromRow(
            row,
            missingChats.filter((chat) => chat.session_id === row.id).map((chat) => chat.id),
          ),
        ),
        chats: missingChats.map(chatFromRow),
      };
    },

    /**
     * Starts syncing on `schedule`, calling `listener` after each background sync. Until then,
     * changes wait for the first sync.
     */
    start(
      listener: (result: SyncResult) => void,
      { replaced }: { replaced?: () => void } = {},
    ) {
      onSynced = listener;
      onReplaced = replaced;
    },

    /** Sets the generation the store was read from, which every write then checks. */
    setGeneration(value: string | null) {
      generation = value;
    },

    /** The generation the store was read from, saved with the snapshot. */
    generation: () => generation,

    /** Stops syncing until `start` is called again, once any sync under way has finished. */
    async stop() {
      onSynced = undefined;
      clearTimeout(timer);
      await running?.catch(() => {});
    },

    /** Forgets what this tab has written, before the database's contents are replaced. */
    reset() {
      sessions.clear();
      chats.clear();
      messages.clear();
    },

    /** Debounced sync, for every store change. */
    schedule() {
      const listener = onSynced;
      if (!listener) return;
      clearTimeout(timer);
      timer = setTimeout(() => {
        sync()
          .then(listener)
          .catch((error) => {
            if (error instanceof DataReplacedError && onReplaced) onReplaced();
            else console.error('Saving to the database failed.', error);
          });
      }, delay);
    },

    /** Records messages read from the database, so loading a chat does not write it back. */
    markLoaded(chatId: string, loadedMessages: MessageProps[]) {
      messages.set(chatId, messageSignatures(loadedMessages));
    },

    /** Whether the database holds this chat's messages as they are now. */
    isPersisted(chat: ChatProps) {
      if (chat.unloaded) return true;
      const known = messages.get(chat.id);
      if (!known || !chats.has(chat.id) || known.size !== chat.messages.length) return false;
      return chat.messages.every(
        (message, position) => known.get(message.id) === signature([position, message]),
      );
    },

    /** Sessions this tab saved that are no longer in the store, until a sync deletes them. */
    pendingDeletes(state: SyncState) {
      const ids = new Set(state.sessions.map((session) => session.id));
      return [...sessions.keys()].filter((id) => !ids.has(id));
    },
  };
}

export type DatabaseSync = ReturnType<typeof createDatabaseSync>;

/** Messages for the given chats, in order. */
export async function loadMessages(db: PGliteInterface, chatIds: string[]) {
  const { rows } = await db.query<{ chat_id: string; data: MessageProps }>(
    'select chat_id, data from messages where chat_id = any($1) order by chat_id, position',
    [chatIds],
  );
  const byChat = new Map<string, MessageProps[]>(chatIds.map((id) => [id, []]));
  for (const row of rows) byChat.get(row.chat_id)?.push(row.data);
  return byChat;
}
