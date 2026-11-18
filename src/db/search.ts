import type { PGliteInterface } from '@electric-sql/pglite';

import { vectorLiteral } from './indexing';

type Database = Pick<PGliteInterface, 'query'>;

/**
 * Edits between two words, where swapping two neighbouring letters counts as one edit (optimal
 * string alignment). Typo correction ranks by this, because trigram similarity alone ranks
 * "recipe" above "receive" for "recieve".
 */
export function editDistance(a: string, b: string) {
  if (a === b) return 0;
  const rows = Array.from({ length: a.length + 1 }, (_, i) =>
    Array.from({ length: b.length + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0)),
  );
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        rows[i][j] = Math.min(rows[i][j], rows[i - 2][j - 2] + 1);
      }
    }
  }
  return rows[a.length][b.length];
}

/** How many typos a word may have. Short words have too many neighbours one typo away. */
export function allowedEdits(term: string) {
  if (term.length >= 7) return 2;
  if (term.length >= 5) return 1;
  return 0;
}

/**
 * Words from the dictionary of indexed text that a term may be a misspelling of. The trigram
 * index finds a shortlist, which is then checked by edit distance.
 */
export async function corrections(db: Database, term: string) {
  const edits = allowedEdits(term);
  if (!edits) return [];
  const { rows } = await db.query<{ word: string }>(
    `select word from search_words where word % $1
     order by similarity(word, $1) desc, word limit 5`,
    [term],
  );
  return rows
    .map((row) => row.word)
    .filter((word) => word !== term && editDistance(word, term) <= edits);
}

/**
 * A full-text query for a term: words starting with it, or one of its corrections. Terms hold
 * only letters and digits, so they cannot carry query syntax.
 */
export function termQuery(term: string, corrected: string[] = []) {
  return [`${term}:*`, ...corrected].join(' | ');
}

/** Sessions and documents with a chunk that matches the query. */
export async function textMatches(db: Database, query: string) {
  const { rows } = await db.query<{ session_id: string | null; document_id: string | null }>(
    `select distinct session_id, document_id from chunks
     where tsv @@ to_tsquery('simple', $1)`,
    [query],
  );
  return {
    sessions: new Set(rows.flatMap((row) => (row.session_id ? [row.session_id] : []))),
    documents: new Set(rows.flatMap((row) => (row.document_id ? [row.document_id] : []))),
  };
}

export type ChunkHit = {
  id: string;
  sessionId: string | null;
  documentId: string | null;
  messageId: string | null;
  text: string;
};

/**
 * For each of these sessions and documents, the chunk that matches the most queries. Ties go to
 * the earliest chunk, in the order of the conversation or document.
 */
export async function bestChunks(
  db: Database,
  queries: string[],
  sessionIds: string[],
  documentIds: string[],
) {
  if (!queries.length || (!sessionIds.length && !documentIds.length)) return [];
  const matches = queries.map((_, index) => `to_tsquery('simple', $${index + 3})`);
  const { rows } = await db.query<ChunkHit>(
    `select distinct on (coalesce(k.session_id, k.document_id))
       k.id, k.session_id as "sessionId", k.document_id as "documentId",
       k.message_id as "messageId", k.text
     from chunks k
     left join messages m on m.id = k.message_id
     left join chats c on c.id = m.chat_id
     where (k.session_id = any($1) or k.document_id = any($2))
       and k.tsv @@ (${matches.join(' || ')})
     order by coalesce(k.session_id, k.document_id),
       ${matches.map((match) => `(k.tsv @@ ${match})::int`).join(' + ')} desc,
       c.position, m.position, k.ordinal`,
    [sessionIds, documentIds, ...queries],
  );
  return rows;
}

/**
 * Chunks closest in meaning to an embedding, nearest first, up to `maxDistance` in cosine
 * distance. Every embedding is compared: building an index costs more than an exact scan saves
 * at this scale.
 */
export async function nearestChunks(
  db: Database,
  embedding: number[],
  { model, limit, maxDistance }: { model: string; limit: number; maxDistance: number },
) {
  const { rows } = await db.query<ChunkHit & { distance: number }>(
    `select * from (
       select id, session_id as "sessionId", document_id as "documentId",
         message_id as "messageId", text, embedding <=> $1::halfvec as distance
       from chunks where embedding is not null and embedding_model = $2
       order by distance limit $3
     ) nearest where distance <= $4`,
    [vectorLiteral(embedding), model, limit, maxDistance],
  );
  return rows;
}

/** Titles of documents, matched in memory alongside their text. */
export async function documentTitles(db: Database) {
  const { rows } = await db.query<{ id: string; title: string; created: number }>(
    'select id, title, created from documents',
  );
  return rows;
}
