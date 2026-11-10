// Display-only buffering for streamed answers. The transport keeps streaming into the store, and
// these helpers decide how much of that text a lane shows while it arrives.

import type { StreamDisplayMode } from '~/constants';

/** The display modes that show an answer piece by piece while it streams. */
export type StreamUnit = Exclude<StreamDisplayMode, 'complete'>;

const FENCE = /^\s*(```+|~~~+)/;
// The end of a sentence, with any quote, bracket or emphasis mark that closes with it.
const SENTENCE_END = /[.!?]+["')\]*_]*(?=\s)/g;
// The number of a list item ends in a full stop but does not end a sentence.
const LIST_NUMBER = /^[\s>*+-]*\d+\.$/;

/**
 * Calls `visit` for each finished line of `text`, saying whether the line is code: a line inside
 * a code fence, or one of the two lines that mark it. Returns where the unfinished last line
 * starts and whether it is code.
 */
function eachFinishedLine(
  text: string,
  visit: (line: string, offset: number, isCode: boolean) => void,
) {
  const lines = text.split('\n');
  let fence: string | undefined;
  let offset = 0;
  // The last line has no newline after it yet, so it is not finished.
  for (const line of lines.slice(0, -1)) {
    const marker = FENCE.exec(line)?.[1];
    visit(line, offset, !!fence || !!marker);
    if (marker && !fence) fence = marker[0];
    else if (marker?.[0] === fence) fence = undefined;
    offset += line.length + 1;
  }
  return { offset, isCode: !!fence || FENCE.test(lines.at(-1) ?? '') };
}

function wordEnds(text: string) {
  // A word is finished once whitespace follows it.
  return [...text.matchAll(/\S+(?=\s)/g)].map((match) => match.index + match[0].length);
}

function sentenceEnds(text: string) {
  const ends: number[] = [];
  const add = (end: number) => {
    if (end > (ends.at(-1) ?? 0)) ends.push(end);
  };
  const addSentences = (line: string, offset: number) => {
    for (const match of line.matchAll(SENTENCE_END)) {
      const end = match.index + match[0].length;
      if (!LIST_NUMBER.test(line.slice(0, end))) add(offset + end);
    }
  };

  const last = eachFinishedLine(text, (line, offset, isCode) => {
    // A full stop in code does not end a sentence, so code is shown a line at a time.
    if (!isCode) addSentences(line, offset);
    // A finished line is shown as well: a heading, a list item, a table row or a line of code.
    if (line.trim()) add(offset + line.trimEnd().length);
  });
  if (!last.isCode) addSentences(text.slice(last.offset), last.offset);
  return ends;
}

function paragraphEnds(text: string) {
  const ends: number[] = [];
  let contentEnd = 0;
  let hasContent = false;
  eachFinishedLine(text, (line, offset, isCode) => {
    if (line.trim() !== '') {
      hasContent = true;
      contentEnd = offset + line.trimEnd().length;
    } else if (!isCode && hasContent) {
      // A blank line outside a code fence finishes the paragraph before it.
      ends.push(contentEnd);
      hasContent = false;
    }
  });
  return ends;
}

/**
 * Where each finished unit of `text` ends, in order. A lane shows the text up to one of these
 * offsets, so a word, sentence or paragraph that is still being written is held back.
 */
export function unitEnds(text: string, unit: StreamUnit): number[] {
  if (unit === 'paragraphs') return paragraphEnds(text);
  if (unit === 'sentences') return sentenceEnds(text);
  return wordEnds(text);
}

/** How fast finished units are shown. Times are in milliseconds. */
export type StreamPace = {
  /** The shortest time between two reveals. Units that finish sooner are shown together. */
  interval: number;
  /**
   * How far behind the lane settles when units keep finishing faster than one per interval. The
   * more units are waiting, the more are shown at a time.
   */
  maxLag: number;
};

/**
 * A slow answer is shown a unit at a time. A fast one is shown several units at a time, so the
 * lane keeps up with the model. Paragraphs are always shown as one batch per interval.
 */
export const STREAM_PACES: Record<StreamUnit, StreamPace> = {
  live: { interval: 30, maxLag: 400 },
  sentences: { interval: 250, maxLag: 600 },
  paragraphs: { interval: 800, maxLag: 800 },
};

/**
 * How many of `backlog` waiting units to show now, `elapsed` milliseconds after the last reveal.
 * One at a time is enough while the lane keeps up. A longer backlog is shown in larger shares,
 * so the lane catches up with a fast stream and does not fall further behind than the pace's lag.
 */
export function unitsToReveal(backlog: number, elapsed: number, pace: StreamPace): number {
  if (backlog <= 0) return 0;
  const share = Math.ceil((backlog * Math.max(elapsed, pace.interval)) / pace.maxLag);
  return Math.min(backlog, Math.max(1, share));
}
