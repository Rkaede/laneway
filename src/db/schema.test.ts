import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';

import { createDatabase } from './create';
import { EMBEDDING_DIMENSIONS, migrate, MIGRATIONS } from './schema';

let db: PGlite;

beforeAll(async () => {
  db = await createDatabase();
});

afterAll(() => db.close());

const vector = (first: number) =>
  `[${[first, ...Array(EMBEDDING_DIMENSIONS - 1).fill(0.01)].join(',')}]`;

async function seedSession(id: string) {
  await db.query(`insert into sessions (id, type, title, created) values ($1, 'chat', $2, 1)`, [
    id,
    `Session ${id}`,
  ]);
  await db.query(`insert into chats (id, session_id, position) values ($1, $2, 0)`, [
    `${id}-chat`,
    id,
  ]);
  await db.query(`insert into messages (id, chat_id, position, data) values ($1, $2, 0, $3)`, [
    `${id}-message`,
    `${id}-chat`,
    { role: 'user', content: 'hello' },
  ]);
}

describe('migrate', () => {
  it('records every migration and does nothing on a second run', async () => {
    await migrate(db);
    const { rows } = await db.query<{ version: number }>(
      'select version from schema_migrations order by version',
    );
    expect(rows.map((row) => row.version)).toEqual(MIGRATIONS.map((_, index) => index + 1));
  });

  it('refuses a database written by a newer schema', async () => {
    const newer = await createDatabase();
    await newer.query('insert into schema_migrations values ($1, 0)', [MIGRATIONS.length + 1]);
    await expect(migrate(newer)).rejects.toThrow('newer version of Laneway');
    await newer.close();
  });
});

describe('database settings', () => {
  it('caps the write-ahead log, which PGlite keeps in memory', async () => {
    const { rows } = await db.query<{ max_wal_size: string }>('show max_wal_size');
    expect(rows[0].max_wal_size).toBe('32MB');
  });
});

describe('schema', () => {
  it('deletes chats, messages and chunks with their session', async () => {
    await seedSession('cascade');
    await db.query(
      `insert into chunks (id, session_id, message_id, text) values ('c1', 'cascade', 'cascade-message', 'hello')`,
    );
    await db.query(`delete from sessions where id = 'cascade'`);
    const { rows } = await db.query<{ total: number }>(
      `select (select count(*) from chats where session_id = 'cascade')
            + (select count(*) from messages where chat_id = 'cascade-chat')
            + (select count(*) from chunks where id = 'c1') as total`,
    );
    expect(Number(rows[0].total)).toBe(0);
  });

  it('requires a chunk to belong to exactly one message or document', async () => {
    await expect(
      db.query(`insert into chunks (id, text) values ('orphan', 'text')`),
    ).rejects.toThrow();
  });

  it('shortlists dictionary words close to a typo, then finds them with full-text search', async () => {
    await seedSession('search');
    await db.query(
      `insert into chunks (id, session_id, message_id, ordinal, text) values
         ('c2', 'search', 'search-message', 0, 'How do I receive a parameter in a route?'),
         ('c3', 'search', 'search-message', 1, 'A recipe for sourdough')`,
    );
    const { rows: shortlist } = await db.query<{ word: string }>(
      `select word from search_words where word % $1 order by similarity(word, $1) desc limit 5`,
      ['recieve'],
    );
    // Trigram similarity alone ranks "recipe" above "receive", so it can only shortlist; the
    // search code picks the winner by edit distance.
    expect(shortlist.map((row) => row.word)).toEqual(['recipe', 'receive']);

    const { rows } = await db.query<{ id: string }>(
      `select id from chunks where tsv @@ to_tsquery('simple', 'receive & parameter')`,
    );
    expect(rows.map((row) => row.id)).toEqual(['c2']);
  });

  it('stores embeddings and ranks chunks by cosine distance', async () => {
    await seedSession('vectors');
    await db.query(
      `insert into chunks (id, session_id, message_id, ordinal, text, embedding) values
         ('near', 'vectors', 'vectors-message', 0, 'near', $1::halfvec),
         ('far', 'vectors', 'vectors-message', 1, 'far', $2::halfvec)`,
      [vector(1), vector(-1)],
    );
    const { rows } = await db.query<{ id: string }>(
      `select id from chunks where embedding is not null order by embedding <=> $1::halfvec`,
      [vector(0.9)],
    );
    expect(rows.map((row) => row.id)).toEqual(['near', 'far']);
  });
});
