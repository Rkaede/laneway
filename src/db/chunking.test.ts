import { describe, expect, it } from 'bun:test';

import { CHUNK_SIZE, chunkText, MAX_CHUNK_SIZE } from './chunking';

const paragraph = (word: string, length: number) =>
  `${word} `
    .repeat(Math.ceil(length / (word.length + 1)))
    .slice(0, length)
    .trim() + '.';

describe('chunkText', () => {
  it('keeps short text whole', () => {
    expect(chunkText('Hello there.')).toEqual(['Hello there.']);
  });

  it('gives no chunks for blank text', () => {
    expect(chunkText('')).toEqual([]);
    expect(chunkText(' \n\n ')).toEqual([]);
  });

  it('splits long text between paragraphs', () => {
    const paragraphs = ['alpha', 'bravo', 'charlie', 'delta'].map((word) =>
      paragraph(word, 700),
    );
    const chunks = chunkText(paragraphs.join('\n\n'));
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(MAX_CHUNK_SIZE);
      // No paragraph is cut in two.
      expect(paragraphs.some((text) => chunk.startsWith(text))).toBe(true);
    }
    expect(chunks.join('\n\n')).toBe(paragraphs.join('\n\n'));
  });

  it('splits a long paragraph between sentences', () => {
    const sentences = Array.from(
      { length: 40 },
      (_, index) => `Sentence number ${index} here.`,
    );
    const text = sentences.join(' ').repeat(3);
    const chunks = chunkText(text);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks.slice(0, -1)) {
      expect(chunk.endsWith('.')).toBe(true);
      expect(chunk.length).toBeLessThanOrEqual(CHUNK_SIZE);
    }
  });

  it('cuts text with no breaks at the maximum size', () => {
    const chunks = chunkText('x'.repeat(MAX_CHUNK_SIZE * 2 + 10));
    expect(chunks.map((chunk) => chunk.length)).toEqual([MAX_CHUNK_SIZE, MAX_CHUNK_SIZE, 10]);
  });
});
