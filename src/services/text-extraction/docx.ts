import { readZipEntry } from './zip';

const ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
};

function decodeEntities(text: string) {
  return text.replaceAll(/&(#x[\da-f]+|#\d+|\w+);/gi, (entity, name: string) => {
    if (name[0] !== '#') return ENTITIES[name] ?? entity;
    const code = name[1] === 'x' ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
    return String.fromCodePoint(code);
  });
}

/** The text of one paragraph of WordprocessingML: its runs, tabs and line breaks. */
function paragraphText(xml: string) {
  // Paragraph properties list tab stops as <w:tab/> too, so they are dropped first.
  const runs = xml.replaceAll(/<w:pPr\b[\s\S]*?<\/w:pPr>/g, '');
  let text = '';
  for (const match of runs.matchAll(
    /<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:(tab|br|cr)\b[^>]*\/>/g,
  )) {
    if (match[2] === 'tab') text += '\t';
    else if (match[2]) text += '\n';
    else text += decodeEntities(match[1]);
  }
  return text;
}

/**
 * The text of a Word document, one paragraph per line. Formatting, images and fields are left
 * out; table cells come through as paragraphs of their own.
 */
export async function docxText(bytes: Uint8Array<ArrayBuffer>) {
  const entry = await readZipEntry(bytes, 'word/document.xml');
  if (!entry) throw new Error('This is not a Word document.');
  const xml = new TextDecoder().decode(entry);
  const body = xml.match(/<w:body\b[^>]*>([\s\S]*)<\/w:body>/)?.[1] ?? xml;
  return body
    .split(/<\/w:p>/)
    .map(paragraphText)
    .join('\n')
    .replaceAll(/\n{3,}/g, '\n\n')
    .trim();
}
