import { describe, expect, it } from 'bun:test';

import { speechChunks } from './speech-text';

describe('speechChunks', () => {
  it('reads Markdown content without formatting, link destinations or definitions', () => {
    expect(
      speechChunks(
        '# Hello **world**\n\n> A *quote* with `code`.\n\n- [docs][guide]\n- ![A cat](cat.png)\n\n[guide]: https://example.com',
      ),
    ).toEqual(['Hello world\nA quote with code.\ndocs\nA cat']);
  });

  it('handles GFM tables, task lists and strikethrough', () => {
    expect(
      speechChunks('| Name | Value |\n| --- | --- |\n| One | ~~Two~~ |\n\n- [x] Done'),
    ).toEqual(['Name\nValue\nOne\nTwo\nDone']);
  });

  it('keeps code content, escaped punctuation and decoded entities', () => {
    expect(speechChunks('```ts\nx => y\n```\n\n\\*literal\\* &amp; text')).toEqual([
      'x => y\n*literal* & text',
    ]);
  });

  it('skips markup and messages without speakable text', () => {
    expect(speechChunks('<script>alert(1)</script>')).toEqual([]);
    expect(speechChunks(' \n\n---\n\n[guide]: https://example.com')).toEqual([]);
  });

  it('keeps exactly 4096 characters in one request', () => {
    expect(speechChunks('a'.repeat(4096))).toEqual(['a'.repeat(4096)]);
  });

  it('splits at word boundaries without truncating long messages', () => {
    const text = 'A spoken sentence. '.repeat(600).trim();
    const chunks = speechChunks(text);

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.every((chunk) => chunk.length > 0 && chunk.length <= 4096)).toBe(true);
    expect(chunks.join(' ')).toBe(text);
  });

  it('splits long words without breaking Unicode surrogate pairs', () => {
    const text = 'a'.repeat(4095) + '🐕'.repeat(2100);
    const chunks = speechChunks(text);

    expect(chunks.every((chunk) => chunk.length <= 4096 && chunk.isWellFormed())).toBe(true);
    expect(chunks.join('')).toBe(text);
  });
});
