import type { PGliteInterface } from '@electric-sql/pglite';

/** The length of every stored embedding. Changing it means re-embedding everything. */
export const EMBEDDING_DIMENSIONS = 512;

/**
 * Schema changes, applied in order. Each entry runs once, in a transaction, and its position in
 * this list is its version number. Never edit or reorder an entry that has shipped: add a new one.
 */
export const MIGRATIONS: string[] = [
  `
    create extension if not exists vector;
    create extension if not exists pg_trgm;

    -- Chats and notes. The sidebar draws from a copy of these rows kept in localStorage, so it
    -- can render before the database opens. Fields the database never queries stay in data.
    create table sessions (
      id text primary key,
      type text not null check (type in ('chat', 'note')),
      title text not null,
      created bigint not null,
      data jsonb not null default '{}'
    );
    create index sessions_created on sessions (created desc);
    create index sessions_title_trgm on sessions using gin (title gin_trgm_ops);

    create table chats (
      id text primary key,
      session_id text not null references sessions (id) on delete cascade,
      position int not null,
      data jsonb not null default '{}'
    );
    create index chats_session on chats (session_id, position);

    create table messages (
      id text primary key,
      chat_id text not null references chats (id) on delete cascade,
      position int not null,
      data jsonb not null
    );
    create index messages_chat on messages (chat_id, position);

    -- Uploaded files keep only their extracted text here. The original bytes live in a separate
    -- IndexedDB store, because PGlite holds its whole data directory in memory.
    create table documents (
      id text primary key,
      title text not null,
      filename text not null,
      mime_type text not null,
      size int not null,
      created bigint not null,
      text text not null
    );

    -- Searchable pieces of chats, notes and documents. Every chunk gets keyword search; it gets
    -- an embedding only when semantic search is turned on. There is no vector index: building
    -- HNSW costs about 20 ms per row in WASM, and an exact scan is fast at personal scale.
    create table chunks (
      id text primary key,
      session_id text references sessions (id) on delete cascade,
      message_id text references messages (id) on delete cascade,
      document_id text references documents (id) on delete cascade,
      ordinal int not null default 0,
      text text not null,
      tsv tsvector generated always as (to_tsvector('simple', text)) stored,
      embedding halfvec(${EMBEDDING_DIMENSIONS}),
      embedding_model text,
      check (num_nonnulls(message_id, document_id) = 1)
    );
    create index chunks_tsv on chunks using gin (tsv);
    create index chunks_session on chunks (session_id);
    create index chunks_message on chunks (message_id);
    create index chunks_document on chunks (document_id);
    create index chunks_unembedded on chunks (id) where embedding is null;

    -- Every word seen in a chunk. A search corrects each query word to its closest match here
    -- before running full-text search, which is how typos still find results.
    create table search_words (word text primary key);
    create index search_words_trgm on search_words using gin (word gin_trgm_ops);

    create function add_search_words() returns trigger language plpgsql as $$
    begin
      insert into search_words (word)
      select lexeme from unnest(new.tsv) on conflict do nothing;
      return new;
    end
    $$;
    create trigger chunks_search_words after insert or update of text on chunks
      for each row execute function add_search_words();

    -- A mirror of the settings, assistants and presets kept in localStorage, so a dump of the
    -- data directory is a complete backup.
    create table kv (key text primary key, value jsonb not null);
    `,
];

export async function migrate(db: PGliteInterface) {
  await db.exec(
    'create table if not exists schema_migrations (version int primary key, applied bigint not null)',
  );
  const { rows } = await db.query<{ version: number }>(
    'select coalesce(max(version), 0)::int as version from schema_migrations',
  );
  const current = rows[0].version;
  if (current > MIGRATIONS.length) {
    throw new Error(
      `The database was written by a newer version of Laneway (schema ${current}). Reload to update.`,
    );
  }
  for (let version = current + 1; version <= MIGRATIONS.length; version++) {
    await db.transaction(async (tx) => {
      await tx.exec(MIGRATIONS[version - 1]);
      await tx.query('insert into schema_migrations values ($1, $2)', [version, Date.now()]);
    });
  }
}
