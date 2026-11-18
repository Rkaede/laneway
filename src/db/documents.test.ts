import type { PGlite } from '@electric-sql/pglite';
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import { MAX_CHUNK_SIZE } from './chunking';
import { createDatabase } from './create';
import {
  addDocument,
  deleteDocuments,
  documentIds,
  getDocument,
  listDocuments,
} from './documents';

let db: PGlite;

beforeEach(async () => {
  db = await createDatabase();
});

afterEach(() => db.close());

const record = (id: string, created: number) => ({
  id,
  title: `Document ${id}`,
  filename: `${id}.pdf`,
  mimeType: 'application/pdf',
  size: 1234,
  created,
});

const longText = Array.from({ length: 30 }, (_, index) =>
  `Paragraph ${index} `.repeat(12).trim(),
).join('\n\n');

describe('documents', () => {
  it('saves a document with its text split into chunks for search', async () => {
    await addDocument(db, { ...record('a', 1), text: longText });

    const document = await getDocument(db, 'a');
    expect(document).toMatchObject(record('a', 1));
    expect(document!.chunks.length).toBeGreaterThan(1);
    expect(document!.chunks.every((chunk) => chunk.text.length <= MAX_CHUNK_SIZE)).toBe(true);
    expect(document!.chunks.map((chunk) => chunk.text).join('\n\n')).toBe(longText);

    const { rows } = await db.query<{ count: number }>(
      `select count(*)::int as count from search_words where word = 'paragraph'`,
    );
    expect(rows[0].count).toBe(1);
  });

  it('lists documents newest first, with the length of their text', async () => {
    await addDocument(db, { ...record('old', 1), text: 'old text' });
    await addDocument(db, { ...record('new', 2), text: 'new text!' });

    expect(await listDocuments(db)).toEqual([
      { ...record('new', 2), characters: 9 },
      { ...record('old', 1), characters: 8 },
    ]);
    expect((await documentIds(db)).sort()).toEqual(['new', 'old']);
  });

  it('deletes documents, deleting their chunks too', async () => {
    await addDocument(db, { ...record('a', 1), text: 'some text' });
    await deleteDocuments(db, ['a']);
    expect(await getDocument(db, 'a')).toBeUndefined();
    const { rows } = await db.query<{ count: number }>(
      'select count(*)::int as count from chunks',
    );
    expect(rows[0].count).toBe(0);
  });

  it('saves nothing when the document cannot be added', async () => {
    await addDocument(db, { ...record('a', 1), text: 'first' });
    await expect(
      addDocument(db, { ...record('a', 2), text: 'duplicate id' }),
    ).rejects.toThrow();
    const { rows } = await db.query<{ text: string }>('select text from chunks');
    expect(rows).toEqual([{ text: 'first' }]);
  });
});
