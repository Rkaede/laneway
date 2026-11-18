import type { PGliteInterface, Transaction } from '@electric-sql/pglite';
import { nanoid } from 'nanoid';

import { chunkText } from './chunking';

type Database = PGliteInterface | Transaction;

/** Messages chunked per transaction, so a large first run does not hold the database for long. */
const BATCH = 200;

/** Roles whose messages are searched. System prompts and tool output are not. */
const SEARCHED_ROLES = ['user', 'assistant'];

export type NewChunk = {
  sessionId: string | null;
  messageId: string | null;
  documentId: string | null;
  ordinal: number;
  text: string;
};

/**
 * Adds chunks. Each gets a new id, so an embedding requested for a chunk that is replaced before
 * the reply arrives is not saved against the new text.
 */
export async function insertChunks(tx: Database, chunks: NewChunk[]) {
  if (!chunks.length) return;
  await tx.query(
    `insert into chunks (id, session_id, message_id, document_id, ordinal, text)
     select * from unnest($1::text[], $2::text[], $3::text[], $4::text[], $5::int[], $6::text[])`,
    [
      chunks.map(() => nanoid()),
      chunks.map((chunk) => chunk.sessionId),
      chunks.map((chunk) => chunk.messageId),
      chunks.map((chunk) => chunk.documentId),
      chunks.map((chunk) => chunk.ordinal),
      chunks.map((chunk) => chunk.text),
    ],
  );
}

/**
 * Chunks one batch of messages that are new or whose text changed, replacing their old chunks.
 * Returns how many messages it indexed, 0 once every message is up to date.
 */
async function indexMessageBatch(db: PGliteInterface, limit = BATCH) {
  return db.transaction(async (tx) => {
    const { rows } = await tx.query<{
      id: string;
      session_id: string;
      role: string;
      text: string;
    }>(
      `select m.id, c.session_id, m.data->>'role' as role, message_text(m.data) as text
       from messages m join chats c on c.id = m.chat_id
       where not m.indexed
       limit $1`,
      [limit],
    );
    if (!rows.length) return 0;
    const ids = rows.map((row) => row.id);
    await tx.query('delete from chunks where message_id = any($1)', [ids]);
    await insertChunks(
      tx,
      rows
        .filter((row) => SEARCHED_ROLES.includes(row.role))
        .flatMap((row) =>
          chunkText(row.text).map((text, ordinal) => ({
            sessionId: row.session_id,
            messageId: row.id,
            documentId: null,
            ordinal,
            text,
          })),
        ),
    );
    await tx.query('update messages set indexed = true where id = any($1)', [ids]);
    return rows.length;
  });
}

/** Chunks every message that needs it. Returns how many messages it indexed. */
export async function indexMessages(db: PGliteInterface) {
  let total = 0;
  for (let count = await indexMessageBatch(db); count; count = await indexMessageBatch(db)) {
    total += count;
  }
  return total;
}

/** Chunks still waiting for an embedding from `model`, the newest sessions and documents first. */
export async function chunksToEmbed(db: Database, model: string, limit: number) {
  const { rows } = await db.query<{ id: string; text: string }>(
    `select k.id, k.text from chunks k
     left join sessions s on s.id = k.session_id
     left join documents d on d.id = k.document_id
     where k.embedding is null or k.embedding_model is distinct from $1
     order by coalesce(s.created, d.created) desc, k.id
     limit $2`,
    [model, limit],
  );
  return rows;
}

/** pgvector's text form of a vector. */
export const vectorLiteral = (values: number[]) => `[${values.join(',')}]`;

/** Saves embeddings. A chunk deleted or replaced since it was read is skipped. */
export async function saveEmbeddings(
  db: Database,
  model: string,
  embeddings: { id: string; embedding: number[] }[],
) {
  if (!embeddings.length) return;
  await db.query(
    `update chunks set embedding = v.embedding::halfvec, embedding_model = $3
     from unnest($1::text[], $2::text[]) as v (id, embedding)
     where chunks.id = v.id`,
    [
      embeddings.map((row) => row.id),
      embeddings.map((row) => vectorLiteral(row.embedding)),
      model,
    ],
  );
}

export type IndexStats = {
  /** Chunks with an embedding from the current model. */
  embedded: number;
  /** Chunks, and messages not chunked yet, waiting for one. */
  pending: number;
  /** Characters of text waiting for an embedding, to estimate the cost. */
  pendingCharacters: number;
};

export async function indexStats(db: Database, model: string): Promise<IndexStats> {
  const { rows } = await db.query<IndexStats>(
    `select
       (select count(*) from chunks where embedding_model = $1 and embedding is not null)::int
         as embedded,
       ((select count(*) from chunks
           where embedding is null or embedding_model is distinct from $1)
         + (select count(*) from messages where not indexed))::int as pending,
       ((select coalesce(sum(length(text)), 0) from chunks
           where embedding is null or embedding_model is distinct from $1)
         + (select coalesce(sum(length(message_text(data))), 0) from messages
             where not indexed and data->>'role' = any($2)))::bigint::float8
         as "pendingCharacters"`,
    [model, SEARCHED_ROLES],
  );
  return rows[0];
}
