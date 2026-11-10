/** The part of a hast tree the Markdown plugins read and write. */
export type HastNode = {
  type: string;
  tagName?: string;
  value?: string;
  properties?: Record<string, unknown>;
  children?: HastNode[];
};

// The code components read the text of these elements whole, so it is left as it is.
const WHOLE_TEXT = new Set(['code', 'pre']);

function wrapWords(node: HastNode) {
  if (!node.children || WHOLE_TEXT.has(node.tagName ?? '')) return;
  node.children = node.children.flatMap((child): HastNode[] => {
    if (child.type !== 'text') {
      wrapWords(child);
      return [child];
    }
    // Splitting on whitespace and keeping it means the pieces join back into the same text.
    return (child.value ?? '')
      .split(/(\s+)/)
      .filter(Boolean)
      .map((piece) =>
        piece.trim()
          ? {
              type: 'element',
              tagName: 'span',
              properties: { dataWord: '' },
              children: [{ type: 'text', value: piece }],
            }
          : { type: 'text', value: piece },
      );
  });
}

/**
 * A rehype plugin that puts each word in a `span[data-word]`, so that the words of a streaming
 * answer can be animated one by one as they arrive.
 */
export function rehypeWordSpans() {
  return wrapWords;
}
