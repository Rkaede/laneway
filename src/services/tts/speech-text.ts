import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import { unified } from 'unified';

const parser = unified().use(remarkParse).use(remarkGfm);
const MAX_SPEECH_LENGTH = 4096;

interface SpeechNode {
  type: string;
  value?: string;
  alt?: string | null;
  children?: SpeechNode[];
}

function plainText(node: SpeechNode): string {
  if (['html', 'definition', 'footnoteDefinition', 'footnoteReference'].includes(node.type))
    return '';
  if (node.type === 'break') return '\n';
  if (node.alt) return node.alt;
  if (node.value) return node.value;
  const inline = [
    'paragraph',
    'heading',
    'emphasis',
    'strong',
    'delete',
    'link',
    'linkReference',
    'tableCell',
  ].includes(node.type);
  return node.children?.map(plainText).join(inline ? '' : '\n') ?? '';
}

export function speechChunks(markdown: string): string[] {
  let text = plainText(parser.parse(markdown)).trim();
  const chunks: string[] = [];

  while (text.length > MAX_SPEECH_LENGTH) {
    const prefix = text.slice(0, MAX_SPEECH_LENGTH);
    let end = Math.max(prefix.lastIndexOf(' '), prefix.lastIndexOf('\n'));
    if (end < MAX_SPEECH_LENGTH / 2) end = MAX_SPEECH_LENGTH;
    // Keep a surrogate pair together when a long word crosses the limit.
    if (/[\uD800-\uDBFF]/.test(text[end - 1])) end--;
    chunks.push(text.slice(0, end).trim());
    text = text.slice(end).trimStart();
  }
  if (text) chunks.push(text);
  return chunks;
}
