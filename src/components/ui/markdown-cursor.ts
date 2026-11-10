import './stream-cursor.css';

import type { HastNode } from './markdown-words';

export type StreamCursorShape = 'square' | 'circle';

// Blocks whose text the cursor follows on the same line.
const TEXT_BLOCKS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
// Blocks that hold other blocks. The cursor goes into the last block inside them.
const CONTAINERS = new Set(['ul', 'ol', 'li', 'blockquote']);
// Blocks with no line of text to end on. The cursor goes on a line of its own below them.
const WHOLE_BLOCKS = new Set(['pre', 'table', 'hr']);

const cursor = (shape: StreamCursorShape): HastNode => ({
  type: 'element',
  tagName: 'span',
  properties: { className: ['stream-cursor'], dataShape: shape, ariaHidden: 'true' },
  children: [],
});

function addCursor(parent: HastNode, shape: StreamCursorShape) {
  const children = (parent.children ??= []);
  const last = children.findLast((child) => child.type === 'element');
  const tag = last?.tagName ?? '';
  if (last && TEXT_BLOCKS.has(tag)) {
    (last.children ??= []).push(cursor(shape));
  } else if (last && CONTAINERS.has(tag)) {
    addCursor(last, shape);
  } else if (WHOLE_BLOCKS.has(tag)) {
    children.push({
      type: 'element',
      tagName: 'div',
      properties: { className: ['stream-cursor-line'], dataStreamCursor: '' },
      children: [cursor(shape)],
    });
  } else if (parent.type !== 'root') {
    // The text sits in the container itself, as in a list item with a single line.
    children.push(cursor(shape));
  }
}

/**
 * A rehype plugin that puts a cursor after the last text of a streaming answer. After a block
 * with no line of text to end on, such as a code block, the cursor goes on a line below it.
 * An answer with no content yet gets no cursor.
 */
export function rehypeStreamCursor(shape: StreamCursorShape) {
  return (tree: HastNode) => addCursor(tree, shape);
}
