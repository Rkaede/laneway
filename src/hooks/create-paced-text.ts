import { createEffect, createSignal, on, onCleanup, untrack } from 'solid-js';

import { type StreamPace, unitsToReveal } from '~/services/stream-display';

type Pacing = StreamPace & {
  /** Where each finished unit of a text ends, in order. */
  ends: (text: string) => number[];
};

/**
 * The part of `source` a lane shows: its finished units, revealed no more often than the pace's
 * interval. When units finish faster than that, several are revealed at once, so the lane catches
 * up with the source and no reveal waits for an animation. The first unit shows at once.
 *
 * Text that is already there when the lane is created is shown whole. With no pacing the whole
 * source is shown as it is.
 */
export function createPacedText(source: () => string, pacing: () => Pacing | undefined) {
  const [text, setText] = createSignal('');
  let timer: ReturnType<typeof setTimeout> | undefined;
  let lastReveal = -Infinity;
  let joined = false;

  function clear() {
    clearTimeout(timer);
    timer = undefined;
  }

  // `late` is how long the waiting units have been due, when a timer brings the lane back here.
  function reveal(late?: number) {
    clear();
    const full = untrack(source);
    const pace = untrack(pacing);
    if (!pace) return setText(full);

    // A source that no longer continues the shown text is a new answer.
    const shown = full.startsWith(untrack(text)) ? untrack(text).length : 0;
    const waiting = pace.ends(full).filter((end) => end > shown);
    const now = performance.now();
    const wait = lastReveal + pace.interval - now;
    if (waiting.length > 0 && wait > 0) {
      timer = setTimeout(() => reveal(performance.now() - lastReveal), wait);
      return;
    }
    // Units that arrive after a pause are not behind, so they start at the usual pace.
    const elapsed = joined ? (late ?? pace.interval) : Infinity;
    const count = unitsToReveal(waiting.length, elapsed, pace);
    if (count === 0) {
      if (shown === 0) setText('');
      return;
    }
    lastReveal = now;
    setText(full.slice(0, waiting[count - 1]));
    if (count < waiting.length) {
      timer = setTimeout(() => reveal(performance.now() - lastReveal), pace.interval);
    }
  }

  createEffect(
    on([source, pacing], ([next]) => {
      if (next) reveal();
      else {
        // An emptied source shows at once, and the answer after it does not wait.
        clear();
        lastReveal = -Infinity;
        setText('');
      }
      joined = true;
    }),
  );
  onCleanup(clear);

  return text;
}
