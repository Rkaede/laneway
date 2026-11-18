import type { PGliteInterface } from '@electric-sql/pglite';

import { chunkText } from './chunking';
import { insertChunks } from './indexing';

export type DocumentRecord = {
  id: string;
  title: string;
  filename: string;
  mimeType: string;
  /** The original file's size in bytes. */
  size: number;
  created: number;
};

export type DocumentSummary = DocumentRecord & {
  /** Characters of extracted text. */
  characters: number;
};

/** A document with its text, split as search found it, so a result can point at its passage. */
export type DocumentWithText = DocumentRecord & {
  chunks: { id: string; text: string }[];
};

const COLUMNS = `id, title, filename, mime_type as "mimeType", size, created`;

/** Saves a document's text and its chunks for search. */
export async function addDocument(
  db: PGliteInterface,
  document: DocumentRecord & { text: string },
) {
  await db.transaction(async (tx) => {
    await tx.query(
      `insert into documents (id, title, filename, mime_type, size, created, text)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        document.id,
        document.title,
        document.filename,
        document.mimeType,
        document.size,
        document.created,
        document.text,
      ],
    );
    await insertChunks(
      tx,
      chunkText(document.text).map((text, ordinal) => ({
        sessionId: null,
        messageId: null,
        documentId: document.id,
        ordinal,
        text,
      })),
    );
  });
}

/** Every document, newest first. */
export async function listDocuments(db: PGliteInterface) {
  const { rows } = await db.query<DocumentSummary>(
    `select ${COLUMNS}, length(text) as characters from documents order by created desc, id`,
  );
  return rows;
}

export async function getDocument(
  db: PGliteInterface,
  id: string,
): Promise<DocumentWithText | undefined> {
  const [document, chunks] = await Promise.all([
    db.query<DocumentRecord>(`select ${COLUMNS} from documents where id = $1`, [id]),
    db.query<{ id: string; text: string }>(
      'select id, text from chunks where document_id = $1 order by ordinal',
      [id],
    ),
  ]);
  const record = document.rows[0];
  return record && { ...record, chunks: chunks.rows };
}

/** Deletes documents, and their chunks with them. */
export async function deleteDocuments(db: PGliteInterface, ids: string[]) {
  await db.query('delete from documents where id = any($1)', [ids]);
}

/** Ids of every document, to match the stored files against. */
export async function documentIds(db: Pick<PGliteInterface, 'query'>) {
  const { rows } = await db.query<{ id: string }>('select id from documents');
  return rows.map((row) => row.id);
}
