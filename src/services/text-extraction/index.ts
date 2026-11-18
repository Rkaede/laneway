/** Kinds of file the library accepts, by MIME type, with the extensions that identify them. */
export const DOCUMENT_TYPES = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md', '.markdown'],
} as const;

export type DocumentType = keyof typeof DOCUMENT_TYPES;

/** For a file input's `accept`. */
export const DOCUMENT_ACCEPT = Object.entries(DOCUMENT_TYPES)
  .flatMap(([type, extensions]) => [type, ...extensions])
  .join(',');

/** PGlite holds the database in memory, so very large files are turned away. */
export const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024;

/** The document type of a file, from its extension first, because browsers often leave the type empty. */
export function documentType(file: Pick<File, 'name' | 'type'>): DocumentType | undefined {
  const name = file.name.toLowerCase();
  const byExtension = Object.entries(DOCUMENT_TYPES).find(([, extensions]) =>
    extensions.some((extension) => name.endsWith(extension)),
  );
  if (byExtension) return byExtension[0] as DocumentType;
  return file.type in DOCUMENT_TYPES ? (file.type as DocumentType) : undefined;
}

export type ExtractedText = { text: string; type: DocumentType };

/** Reads a file's text, or throws an error that explains why it cannot. */
export async function extractText(file: File): Promise<ExtractedText> {
  const type = documentType(file);
  if (!type) throw new Error('Only PDF, Word (.docx), text and Markdown files can be added.');
  if (file.size > MAX_DOCUMENT_SIZE) throw new Error('Files over 50 MB cannot be added.');

  let text: string;
  if (type === 'application/pdf') {
    const { pdfText } = await import('./pdf');
    text = (await pdfText(new Uint8Array(await file.arrayBuffer()))).text;
  } else if (type === 'text/plain' || type === 'text/markdown') {
    text = await file.text();
  } else {
    const { docxText } = await import('./docx');
    text = await docxText(new Uint8Array(await file.arrayBuffer()));
  }

  // Postgres text cannot hold a NUL character, which some PDFs produce.
  text = text.replaceAll('\0', '').trim();
  if (!text) {
    throw new Error(
      type === 'application/pdf'
        ? 'This PDF has no text to read. Scanned pages are images, which cannot be searched yet.'
        : 'This file has no text.',
    );
  }
  return { text, type };
}

/** A title from a file name, without its extension. */
export function documentTitle(filename: string) {
  return filename.replace(/\.[^.]+$/, '').trim() || filename;
}
