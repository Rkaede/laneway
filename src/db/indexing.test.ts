import type { PGlite } from '@electric-sql/pglite';
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import { createDatabase } from './create';
import { chunksToEmbed, indexMessages, indexStats, saveEmbeddings } from './indexing';
import { EMBEDDING_DIMENSIONS } from './schema';

let db: PGlite;

beforeEach(async () => {
  db = await createDatabase();
  await db.query(
    `insert into sessions (id, type, title, created) values ('s', 'chat', 'S', 1)`,
  );
  await db.query(`insert into chats (id, session_id, position) values ('c', 's', 0)`);
});

afterEach(() => db.close());

async function addMessage(id: string, data: Record<string, unknown>, position = 0) {
  await db.query(
    `insert into messages (id, chat_id, position, data) values ($1, 'c', $2, $3)`,
    [id, position, { id, ...data }],
  );
}

const chunks = async () =>
  (
    await db.query<{ message_id: string; ordinal: number; text: string }>(
      'select message_id, ordinal, text from chunks order by message_id, ordinal',
    )
  ).rows;

const embedding = Array(EMBEDDING_DIMENSIONS).fill(0.25);

describe('message_text', () => {
  it('reads string content and the text parts of mixed content', async () => {
    const { rows } = await db.query<{ a: string; b: string; c: string }>(
      `select message_text($1) as a, message_text($2) as b, message_text($3) as c`,
      [
        { content: 'plain' },
        {
          content: [
            { type: 'text', text: 'first' },
            { type: 'image', image: { storageId: 'x' } },
            { type: 'text', text: 'second' },
          ],
        },
        { content: [{ type: 'image', image: { storageId: 'x' } }] },
      ],
    );
    expect(rows[0]).toEqual({ a: 'plain', b: 'first\nsecond', c: '' });
  });
});

describe('indexMessages', () => {
  it('chunks user and assistant messages, and skips the rest', async () => {
    await addMessage('m1', { role: 'user', content: 'How do I bake bread?' });
    await addMessage('m2', { role: 'assistant', content: 'Start with flour.' }, 1);
    await addMessage('m3', { role: 'system', content: 'You are helpful.' }, 2);
    await addMessage('m4', { role: 'user', content: [{ type: 'image', image: {} }] }, 3);

    expect(await indexMessages(db)).toBe(4);
    expect(await chunks()).toEqual([
      { message_id: 'm1', ordinal: 0, text: 'How do I bake bread?' },
      { message_id: 'm2', ordinal: 0, text: 'Start with flour.' },
    ]);
    // Everything is indexed, so a second run does nothing.
    expect(await indexMessages(db)).toBe(0);
  });

  it('indexes a message again when its text changes, and not when only other fields do', async () => {
    await addMessage('m1', { role: 'user', content: 'original text' });
    await indexMessages(db);
    await saveEmbeddings(db, 'model', [
      { id: (await db.query<{ id: string }>('select id from chunks')).rows[0].id, embedding },
    ]);

    await db.query(`update messages set data = data || '{"status": "idle"}' where id = 'm1'`);
    expect(await indexMessages(db)).toBe(0);
    const kept = await db.query<{ model: string }>(
      'select embedding_model as model from chunks',
    );
    expect(kept.rows).toEqual([{ model: 'model' }]);

    await db.query(
      `update messages set data = data || '{"content": "edited text"}' where id = 'm1'`,
    );
    expect(await indexMessages(db)).toBe(1);
    expect((await chunks()).map((chunk) => chunk.text)).toEqual(['edited text']);
    const replaced = await db.query<{ embedding: string | null }>(
      'select embedding from chunks',
    );
    expect(replaced.rows).toEqual([{ embedding: null }]);
  });

  it('adds the words of new chunks to the typo dictionary', async () => {
    await addMessage('m1', { role: 'user', content: 'sourdough starter' });
    await indexMessages(db);
    const { rows } = await db.query<{ word: string }>(
      'select word from search_words order by word',
    );
    expect(rows.map((row) => row.word)).toEqual(['sourdough', 'starter']);
  });
});

describe('embeddings', () => {
  it('lists chunks without an embedding from the model, and saves embeddings', async () => {
    await addMessage('m1', { role: 'user', content: 'first' });
    await addMessage('m2', { role: 'user', content: 'second' }, 1);
    await indexMessages(db);

    const pending = await chunksToEmbed(db, 'model', 10);
    expect(pending.map((chunk) => chunk.text).sort()).toEqual(['first', 'second']);
    expect(await indexStats(db, 'model')).toEqual({
      embedded: 0,
      pending: 2,
      pendingCharacters: 'first'.length + 'second'.length,
    });

    await saveEmbeddings(db, 'model', [{ id: pending[0].id, embedding }]);
    expect(await chunksToEmbed(db, 'model', 10)).toEqual([pending[1]]);
    expect(await indexStats(db, 'model')).toMatchObject({ embedded: 1, pending: 1 });

    // Embeddings from another model are out of date.
    expect(await chunksToEmbed(db, 'newer-model', 10)).toHaveLength(2);
  });

  it('counts messages not chunked yet in the estimate', async () => {
    await addMessage('m1', { role: 'user', content: 'twelve chars' });
    expect(await indexStats(db, 'model')).toEqual({
      embedded: 0,
      pending: 1,
      pendingCharacters: 12,
    });
  });

  it('ignores an embedding for a chunk that was replaced', async () => {
    await addMessage('m1', { role: 'user', content: 'before' });
    await indexMessages(db);
    const [stale] = await chunksToEmbed(db, 'model', 10);
    await db.query(`update messages set data = data || '{"content": "after"}'`);
    await indexMessages(db);

    await saveEmbeddings(db, 'model', [{ id: stale.id, embedding }]);
    expect(await indexStats(db, 'model')).toMatchObject({ embedded: 0, pending: 1 });
  });
});
