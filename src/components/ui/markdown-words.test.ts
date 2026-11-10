import { describe, expect, it } from 'bun:test';

import { type HastNode as Node, rehypeWordSpans } from './markdown-words';

const text = (value: string): Node => ({ type: 'text', value });
const element = (tagName: string, ...children: Node[]): Node => ({
  type: 'element',
  tagName,
  properties: {},
  children,
});
const word = (value: string): Node => ({
  type: 'element',
  tagName: 'span',
  properties: { dataWord: '' },
  children: [text(value)],
});
const wrapped = (tree: Node) => {
  rehypeWordSpans()(tree);
  return tree;
};

describe('rehypeWordSpans', () => {
  it('puts each word in its own span and keeps the whitespace between them', () => {
    const tree = wrapped({ type: 'root', children: [element('p', text('One two\nthree.'))] });

    expect(tree.children).toEqual([
      element('p', word('One'), text(' '), word('two'), text('\n'), word('three.')),
    ]);
  });

  it('wraps the words inside nested elements', () => {
    const tree = wrapped({
      type: 'root',
      children: [element('p', text('A '), element('strong', text('bold word')), text('.'))],
    });

    expect(tree.children).toEqual([
      element(
        'p',
        word('A'),
        text(' '),
        element('strong', word('bold'), text(' '), word('word')),
        word('.'),
      ),
    ]);
  });

  it('leaves whitespace between blocks as text', () => {
    const tree = wrapped({ type: 'root', children: [element('p', text('One')), text('\n')] });

    expect(tree.children).toEqual([element('p', word('One')), text('\n')]);
  });

  it('leaves inline code and code blocks whole, because their components read the text', () => {
    const code = () => element('code', text('const a = 1;'));
    const tree = wrapped({
      type: 'root',
      children: [element('p', text('Run '), code()), element('pre', code())],
    });

    expect(tree.children).toEqual([
      element('p', word('Run'), text(' '), code()),
      element('pre', code()),
    ]);
  });
});
