import { describe, expect, it } from 'bun:test';

import { rehypeStreamCursor } from './markdown-cursor';
import type { HastNode } from './markdown-words';

const text = (value: string): HastNode => ({ type: 'text', value });
const element = (tagName: string, ...children: HastNode[]): HastNode => ({
  type: 'element',
  tagName,
  properties: {},
  children,
});
const cursor: HastNode = {
  type: 'element',
  tagName: 'span',
  properties: { className: ['stream-cursor'], dataShape: 'square', ariaHidden: 'true' },
  children: [],
};
const cursorLine: HastNode = {
  type: 'element',
  tagName: 'div',
  properties: { className: ['stream-cursor-line'], dataStreamCursor: '' },
  children: [cursor],
};
const withCursor = (...children: HastNode[]) => {
  const tree: HastNode = { type: 'root', children };
  rehypeStreamCursor('square')(tree);
  return tree.children;
};

describe('rehypeStreamCursor', () => {
  it('follows the last text of the last paragraph', () => {
    expect(
      withCursor(element('p', text('One.')), text('\n'), element('p', text('Two'))),
    ).toEqual([element('p', text('One.')), text('\n'), element('p', text('Two'), cursor)]);
  });

  it('follows the text of a heading', () => {
    expect(withCursor(element('h2', text('Title')))).toEqual([
      element('h2', text('Title'), cursor),
    ]);
  });

  it('follows the text of the last list item, with or without a paragraph inside it', () => {
    expect(
      withCursor(element('ul', element('li', text('a')), element('li', text('b')))),
    ).toEqual([element('ul', element('li', text('a')), element('li', text('b'), cursor))]);
    expect(withCursor(element('ol', element('li', element('p', text('a')))))).toEqual([
      element('ol', element('li', element('p', text('a'), cursor))),
    ]);
  });

  it('follows text that ends in an inline element', () => {
    expect(withCursor(element('ul', element('li', element('strong', text('a')))))).toEqual([
      element('ul', element('li', element('strong', text('a')), cursor)),
    ]);
  });

  it('goes on a line below a block with no text to end on', () => {
    const code = () => element('pre', element('code', text('const a = 1;')));

    expect(withCursor(element('p', text('Run:')), code())).toEqual([
      element('p', text('Run:')),
      code(),
      cursorLine,
    ]);
    expect(
      withCursor(element('ul', element('li', element('p', text('Run:')), code()))),
    ).toEqual([element('ul', element('li', element('p', text('Run:')), code(), cursorLine))]);
  });

  it('adds no cursor before there is any content', () => {
    expect(withCursor()).toEqual([]);
  });
});
