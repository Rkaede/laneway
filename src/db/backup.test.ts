import type { PGlite } from '@electric-sql/pglite';
import { afterEach, describe, expect, it } from 'bun:test';

import { dumpDatabase, NewerBackupError, restoreDatabase } from './backup';
import { createDatabase } from './create';
import { BACKUP_TABLES, DERIVED_TABLES, EMBEDDING_DIMENSIONS, MIGRATIONS } from './schema';
import { readGeneration } from './sync';

const open: PGlite[] = [];

async function database(schema?: number) {
  const db = await createDatabase(undefined, { schema });
  open.push(db);
  return db;
}

afterEach(async () => {
  await Promise.all(open.splice(0).map((db) => db.close()));
});

const embedding = `[${Array(EMBEDDING_DIMENSIONS).fill(0.5).join(',')}]`;

async function seed(db: PGlite, id: string, text: string) {
  await db.query(
    `insert into sessions (id, type, title, created, data) values ($1, 'chat', $2, 1, '{}')`,
    [id, `Session ${id}`],
  );
  await db.query(
    `insert into chats (id, session_id, position, data) values ($1, $2, 0, '{}')`,
    [`${id}-chat`, id],
  );
  await db.query(`insert into messages (id, chat_id, position, data) values ($1, $2, 0, $3)`, [
    `${id}-message`,
    `${id}-chat`,
    {
      id: `${id}-message`,
      role: 'user',
      content: [
        { type: 'text', text },
        { type: 'image', image: { filename: 'photo.png', storageId: `${id}-image` } },
      ],
    },
  ]);
  await db.query(
    `insert into chunks (id, session_id, message_id, ordinal, text, embedding, embedding_model)
     values ($1, $2, $3, 0, $4, $5, 'model')`,
    [`${id}-chunk`, id, `${id}-message`, text, embedding],
  );
}

const count = async (db: PGlite, table: string) =>
  (await db.query<{ count: number }>(`select count(*)::int as count from ${table}`)).rows[0]
    .count;

describe('database backups', () => {
  it('lists every table, so a new one is not left out of backups by accident', async () => {
    const db = await database();
    const { rows } = await db.query<{ name: string }>(
      `select table_name as name from information_schema.tables
       where table_schema = 'public' and table_type = 'BASE TABLE' and table_name <> 'schema_migrations'`,
    );
    expect(rows.map((row) => row.name).sort()).toEqual(
      [...BACKUP_TABLES, ...DERIVED_TABLES].sort(),
    );
  });

  it('replaces every row with the backup and rebuilds the search dictionary', async () => {
    const source = await database();
    await seed(source, 'kept', 'remembered quokka');
    await source.query(`insert into kv values ('setting', '{"on": true}')`);
    const { dump, images } = await dumpDatabase(source);
    expect(images).toEqual(['kept-image']);

    const target = await database();
    await seed(target, 'replaced', 'forgotten wombat');
    const result = await restoreDatabase(target, dump);

    expect(result).toMatchObject({
      previousImages: ['replaced-image'],
      images: ['kept-image'],
    });
    // A new generation, so other tabs do not save over the restored data.
    expect(await readGeneration(target)).toBe(result.generation);
    expect(result.generation).not.toBe(await readGeneration(source));
    expect((await target.query('select id from sessions')).rows).toEqual([{ id: 'kept' }]);
    for (const table of ['chats', 'messages', 'chunks']) {
      expect(await count(target, table)).toBe(1);
    }
    const kv = await target.query('select key, value from kv where key <> $1', ['generation']);
    expect(kv.rows).toEqual([{ key: 'setting', value: { on: true } }]);
    const chunk = await target.query<{ text: string; embedding: string; tsv: string }>(
      'select text, embedding::text, tsv::text from chunks',
    );
    expect(chunk.rows[0].text).toBe('remembered quokka');
    expect(chunk.rows[0].embedding).toBe(
      (await source.query<{ embedding: string }>('select embedding::text from chunks')).rows[0]
        .embedding,
    );
    expect(chunk.rows[0].tsv).toContain('quokka');
    const words = await target.query<{ word: string }>(
      'select word from search_words order by word',
    );
    expect(words.rows.map((row) => row.word)).toEqual(['quokka', 'remembered']);
  });

  it('leaves the data as it was when a table fails to load', async () => {
    const source = await database();
    await seed(source, 'kept', 'remembered quokka');
    const { dump } = await dumpDatabase(source);
    const target = await database();
    await seed(target, 'current', 'current data');
    const broken = {
      ...dump,
      tables: dump.tables.map((table) =>
        table.name === 'messages' ? { ...table, data: new Blob(['not copy data']) } : table,
      ),
    };

    await expect(restoreDatabase(target, broken)).rejects.toThrow();

    expect((await target.query('select id from sessions')).rows).toEqual([{ id: 'current' }]);
    expect(await count(target, 'search_words')).toBeGreaterThan(0);
  });

  it('refuses a backup from a newer schema', async () => {
    const db = await database();
    const { dump } = await dumpDatabase(db);

    await expect(
      restoreDatabase(db, { ...dump, schema: MIGRATIONS.length + 1 }),
    ).rejects.toBeInstanceOf(NewerBackupError);
  });

  it('upgrades a backup from an older schema before loading it', async () => {
    const schema = MIGRATIONS.length;
    const old = await database();
    await seed(old, 'old', 'older backup');
    const { dump } = await dumpDatabase(old);

    MIGRATIONS.push(`alter table sessions add column pinned boolean not null default false`);
    try {
      const target = await database();
      await restoreDatabase(target, { ...dump, schema });
      const { rows } = await target.query('select id, pinned from sessions');
      expect(rows).toEqual([{ id: 'old', pinned: false }]);
    } finally {
      MIGRATIONS.pop();
    }
  });
});
