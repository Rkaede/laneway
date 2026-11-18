/**
 * Text is split into chunks of about this many characters, roughly 300 tokens. Most chat messages
 * fit in one. Smaller chunks make an embedding about one idea, and a search result point at the
 * passage that matched rather than at a whole document.
 */
export const CHUNK_SIZE = 1200;

/** No chunk is longer than this, even when the text has no break to split it at. */
export const MAX_CHUNK_SIZE = 2000;

/** Where text may be split, best first: paragraphs, lines, sentences, then words. */
const BREAKS = [/\n\s*\n/g, /\n/g, /(?<=[.!?])\s+/g, /\s+/g];

/** The positions just after each break of this kind. */
function breaksIn(text: string, pattern: RegExp) {
  return [...text.matchAll(pattern)].map((match) => match.index + match[0].length);
}

/** Where to end a chunk that starts at `start`: at the best break near the target size. */
function chunkEnd(text: string, start: number) {
  if (text.length - start <= MAX_CHUNK_SIZE) return text.length;
  const window = text.slice(start, start + MAX_CHUNK_SIZE);
  for (const pattern of BREAKS) {
    // The last break that keeps the chunk under the limit, as long as it is not too early.
    const positions = breaksIn(window, pattern).filter(
      (position) => position >= CHUNK_SIZE / 2 && position < window.length,
    );
    if (!positions.length) continue;
    const near = positions.filter((position) => position <= CHUNK_SIZE);
    return start + (near.at(-1) ?? positions[0]);
  }
  return start + MAX_CHUNK_SIZE;
}

/** Splits text into chunks at natural breaks. Blank text gives no chunks. */
export function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = chunkEnd(text, start);
    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    start = end;
  }
  return chunks;
}
