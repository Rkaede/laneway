import { describe, expect, it } from 'bun:test';

import { getStreamDisplayMode } from '~/constants';

import { STREAM_PACES, type StreamUnit, unitEnds, unitsToReveal } from './stream-display';

/** What a lane shows of `text` once it has caught up. */
const shown = (text: string, unit: StreamUnit) =>
  text.slice(0, unitEnds(text, unit).at(-1) ?? 0);
/** The finished units of `text`, one string each. */
const units = (text: string, unit: StreamUnit) => {
  const ends = unitEnds(text, unit);
  return ends.map((end, index) => text.slice(ends[index - 1] ?? 0, end).trim());
};

describe('paragraphs', () => {
  it('holds back text until a paragraph is finished', () => {
    expect(shown('', 'paragraphs')).toBe('');
    expect(shown('First paragraph still being wri', 'paragraphs')).toBe('');
    expect(shown('First paragraph.\n', 'paragraphs')).toBe('');
  });

  it('shows finished paragraphs and holds back the one in progress', () => {
    expect(shown('One.\n\nTwo is being wri', 'paragraphs')).toBe('One.');
    expect(units('One.\n\nTwo.\n\nThree is being wri', 'paragraphs')).toEqual(['One.', 'Two.']);
  });

  it('treats a whitespace-only line as a paragraph break', () => {
    expect(shown('One.\n  \nTwo', 'paragraphs')).toBe('One.');
  });

  it('keeps lines of one paragraph together', () => {
    expect(units('- a\n- b\n- c\n\n- d', 'paragraphs')).toEqual(['- a\n- b\n- c']);
  });

  it('does not split on blank lines inside a code fence', () => {
    const text = 'Intro.\n\n```ts\nconst a = 1;\n\nconst b = 2;\n';
    expect(shown(text, 'paragraphs')).toBe('Intro.');
  });

  it('shows a code block once its fence is closed and a blank line follows', () => {
    const block = '```ts\nconst a = 1;\n\nconst b = 2;\n```';
    expect(shown(`Intro.\n\n${block}\n\nNext`, 'paragraphs')).toBe(`Intro.\n\n${block}`);
    expect(shown(`Intro.\n\n${block}\nNext`, 'paragraphs')).toBe('Intro.');
  });

  it('only closes a fence with the same marker', () => {
    expect(shown('~~~\ncode\n```\n\nmore\n', 'paragraphs')).toBe('');
  });
});

describe('sentences', () => {
  it('shows each sentence once whitespace follows it', () => {
    expect(units('One. Two! Three? Four is being wri', 'sentences')).toEqual([
      'One.',
      'Two!',
      'Three?',
    ]);
    expect(shown('A sentence that has just ended.', 'sentences')).toBe('');
  });

  it('keeps a closing quote, bracket or emphasis mark with its sentence', () => {
    expect(units('**Start early.** She said "go." (Really.) Next', 'sentences')).toEqual([
      '**Start early.**',
      'She said "go."',
      '(Really.)',
    ]);
  });

  it('does not split a number or a list number from what follows it', () => {
    expect(units('It grows by 5.5% a year. Next', 'sentences')).toEqual([
      'It grows by 5.5% a year.',
    ]);
    expect(units('1. First item. More\n2. Sec', 'sentences')).toEqual([
      '1. First item.',
      'More',
    ]);
  });

  it('shows a finished line that has no full stop, such as a heading or a list item', () => {
    expect(units('## Title\n\n- one\n- two\n- thr', 'sentences')).toEqual([
      '## Title',
      '- one',
      '- two',
    ]);
  });

  it('shows code a line at a time and ignores full stops inside it', () => {
    const text = 'Run it.\n\n```ts\nconsole.log(a. b);\nconst c = 1; // done. \n```\n\nNext';
    expect(units(text, 'sentences')).toEqual([
      'Run it.',
      '```ts',
      'console.log(a. b);',
      'const c = 1; // done.',
      '```',
    ]);
    expect(units('```ts\nconsole.log(a. b', 'sentences')).toEqual(['```ts']);
  });
});

describe('words', () => {
  it('shows each word once whitespace follows it', () => {
    expect(units('One two\nthree fou', 'live')).toEqual(['One', 'two', 'three']);
    expect(shown('One two\nthree fou', 'live')).toBe('One two\nthree');
  });

  it('shows nothing while the first word is being written', () => {
    expect(shown('Fir', 'live')).toBe('');
  });
});

describe('unitsToReveal', () => {
  const words = STREAM_PACES.live;

  it('shows nothing when nothing is waiting', () => {
    expect(unitsToReveal(0, 1000, words)).toBe(0);
  });

  it('shows one unit at a time while the lane keeps up', () => {
    expect(unitsToReveal(1, words.interval, words)).toBe(1);
    expect(unitsToReveal(10, words.interval, words)).toBe(1);
  });

  it('shows more at a time as the backlog grows', () => {
    const share = (backlog: number) => unitsToReveal(backlog, words.interval, words);

    expect(share(40)).toBeGreaterThan(1);
    expect(share(400)).toBeGreaterThan(share(40));
  });

  it('settles at its lag behind a stream that stays faster than one unit per interval', () => {
    // A stream that finishes five units per interval. The backlog stops growing once a share is
    // as large as what arrives in one interval.
    const perInterval = 5;
    let backlog = 0;
    for (let tick = 0; tick < 200; tick++) {
      backlog += perInterval;
      backlog -= unitsToReveal(backlog, words.interval, words);
    }
    const lag = (backlog / perInterval) * words.interval;

    expect(lag).toBeLessThanOrEqual(words.maxLag);
    expect(lag).toBeGreaterThan(words.maxLag / 2);
  });

  it('shows everything that is waiting after a long gap', () => {
    expect(unitsToReveal(7, words.maxLag, words)).toBe(7);
    expect(unitsToReveal(7, Infinity, words)).toBe(7);
  });

  it('shows all waiting paragraphs in one batch', () => {
    const { paragraphs } = STREAM_PACES;
    expect(unitsToReveal(3, paragraphs.interval, paragraphs)).toBe(3);
  });
});

describe('getStreamDisplayMode', () => {
  it.each(['live', 'sentences', 'paragraphs', 'complete'])('keeps the saved mode %s', (id) => {
    expect(getStreamDisplayMode(id).id).toBe(id);
  });

  it.each([undefined, '', 'typewriter', 3])('falls back to paragraphs for %p', (id) => {
    expect(getStreamDisplayMode(id).id).toBe('paragraphs');
  });
});
