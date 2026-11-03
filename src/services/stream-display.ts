// Display-only buffering for streamed answers. The transport keeps streaming into the store, and
// these helpers decide how much of that text a lane shows while it arrives.

import type { StreamDisplayMode } from '~/constants';

const FENCE = /^\s*(```+|~~~+)/;

/**
 * The part of `text` that ends at the last finished paragraph: everything before the last blank
 * line that is not inside a code fence. A trailing paragraph still being written is held back.
 */
export function completedParagraphs(text: string): string {
  const lines = text.split('\n');
  let fence: string | undefined;
  let offset = 0;
  let end = 0;
  let hasContent = false;

  // The last line has no newline after it yet, so it can never end a paragraph.
  for (const line of lines.slice(0, -1)) {
    const marker = FENCE.exec(line)?.[1];
    if (marker) {
      if (!fence) fence = marker[0];
      else if (marker[0] === fence) fence = undefined;
      hasContent = true;
    } else if (!fence && line.trim() === '') {
      if (hasContent) end = offset;
      hasContent = false;
    } else if (line.trim() !== '') {
      hasContent = true;
    }
    offset += line.length + 1;
  }
  return text.slice(0, end).trimEnd();
}

/** What a lane shows of an answer that is still streaming. */
export function visibleStreamText(text: string, mode: StreamDisplayMode): string {
  if (mode === 'complete') return '';
  if (mode === 'paragraphs') return completedParagraphs(text);
  return text;
}
