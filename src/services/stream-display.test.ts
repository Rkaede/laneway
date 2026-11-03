import { describe, expect, it } from 'bun:test';

import { getStreamDisplayMode } from '~/constants';

import { completedParagraphs, visibleStreamText } from './stream-display';

describe('completedParagraphs', () => {
  it('holds back text until a paragraph is finished', () => {
    expect(completedParagraphs('')).toBe('');
    expect(completedParagraphs('First paragraph still being wri')).toBe('');
    expect(completedParagraphs('First paragraph.\n')).toBe('');
  });

  it('shows finished paragraphs and holds back the one in progress', () => {
    expect(completedParagraphs('One.\n\nTwo is being wri')).toBe('One.');
    expect(completedParagraphs('One.\n\nTwo.\n\nThree is being wri')).toBe('One.\n\nTwo.');
  });

  it('treats a whitespace-only line as a paragraph break', () => {
    expect(completedParagraphs('One.\n  \nTwo')).toBe('One.');
  });

  it('keeps lines of one paragraph together', () => {
    expect(completedParagraphs('- a\n- b\n- c\n\n- d')).toBe('- a\n- b\n- c');
  });

  it('does not split on blank lines inside a code fence', () => {
    const text = 'Intro.\n\n```ts\nconst a = 1;\n\nconst b = 2;\n';
    expect(completedParagraphs(text)).toBe('Intro.');
  });

  it('shows a code block once its fence is closed and a blank line follows', () => {
    const block = '```ts\nconst a = 1;\n\nconst b = 2;\n```';
    expect(completedParagraphs(`Intro.\n\n${block}\n\nNext`)).toBe(`Intro.\n\n${block}`);
    expect(completedParagraphs(`Intro.\n\n${block}\nNext`)).toBe('Intro.');
  });

  it('only closes a fence with the same marker', () => {
    expect(completedParagraphs('~~~\ncode\n```\n\nmore\n')).toBe('');
  });
});

describe('visibleStreamText', () => {
  const text = 'One.\n\nTwo is being wri';

  it('shows everything live, without delaying the reader', () => {
    expect(visibleStreamText(text, 'live')).toBe(text);
  });

  it('shows only finished paragraphs when buffering paragraphs', () => {
    expect(visibleStreamText(text, 'paragraphs')).toBe('One.');
  });

  it('shows nothing until the answer is complete', () => {
    expect(visibleStreamText(text, 'complete')).toBe('');
  });
});

describe('getStreamDisplayMode', () => {
  it.each(['live', 'paragraphs', 'complete'])('keeps the saved mode %s', (id) => {
    expect(getStreamDisplayMode(id).id).toBe(id);
  });

  it.each([undefined, '', 'typewriter', 3])('falls back to live for %p', (id) => {
    expect(getStreamDisplayMode(id).id).toBe('live');
  });
});
