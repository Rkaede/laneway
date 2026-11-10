import { createEffect, createSignal, on, onCleanup, untrack } from 'solid-js';

import type { StreamAnimation } from '~/services/stream-trials';
import type { ChatProps } from '~/types';

import { prefersReducedMotion } from './create-stream-follow';

// ChatPanel puts this attribute on the element around the message that is still streaming.
const INCOMING = '[data-incoming-message]';

// The same curve as the --ease-out token.
const EASING = 'cubic-bezier(0, 0, 0.2, 1)';

/**
 * What is animated as it appears. Blocks are the top-level blocks of an answer and its list items.
 * Words are the spans Markdown puts each word in when asked to, along with whole code blocks,
 * whose text is not split into words.
 */
type Pieces = 'blocks' | 'words';

const SELECTORS: Record<Pieces, string> = {
  blocks: '.prose > :not([data-stream-cursor]), .prose li',
  words: '.prose [data-word], .prose pre',
};

type StreamRevealOptions = {
  /** The pieces to animate, or undefined to animate nothing. */
  pieces: () => Pieces | undefined;
  animation: () => StreamAnimation;
  status: () => ChatProps['status'];
};

/**
 * Animates the pieces of a streaming answer as they are added to `lane`. Pieces added together
 * appear together. When the answer finishes, the finished message replaces the streaming one,
 * and only the pieces the reader has not seen yet are animated.
 */
export function createStreamReveal(
  lane: () => HTMLElement | undefined,
  options: StreamRevealOptions,
) {
  // How many pieces of the current answer are on screen. Undefined while no answer is streaming.
  let shown: number | undefined;
  // When the animation of each piece started, by the piece's position in the answer. An entry is
  // dropped once its animation has ended.
  const started = new Map<number, number>();

  function answer(element: HTMLElement) {
    const status = untrack(options.status);
    if (status === 'loading') return element.querySelector(INCOMING);
    // A finished or stopped answer has just been added as the last message of the lane.
    if (status === 'idle' || status === 'canceled') {
      return [...element.querySelectorAll('[data-message-id]')].at(-1);
    }
    return undefined;
  }

  function piecesOf(element: HTMLElement) {
    const pieces = untrack(options.pieces);
    const message = answer(element);
    if (!pieces || !message) return [];
    return [...message.querySelectorAll<HTMLElement>(SELECTORS[pieces])];
  }

  function animate(piece: HTMLElement, start: number, now: number) {
    const { keyframes, duration } = untrack(options.animation);
    if (!keyframes) return;
    piece.animate(keyframes, {
      duration,
      // An animation that started earlier gets a negative delay, which starts it part-way through.
      delay: start - now,
      easing: EASING,
    });
  }

  function reveal() {
    const element = lane();
    if (!element || shown === undefined) return;
    const streaming = untrack(options.status) === 'loading';
    const pieces = piecesOf(element);
    let fresh = pieces.slice(shown);
    if (untrack(options.pieces) === 'blocks') {
      // A new list appears as one block, so its items are not animated again inside it.
      const added = fresh;
      fresh = added.filter(
        (block) => !added.some((other) => other !== block && other.contains(block)),
      );
    }
    const now = performance.now();
    const duration = untrack(options.animation).duration ?? 0;
    for (const [index, start] of started) {
      if (start + duration <= now) started.delete(index);
    }

    if (!prefersReducedMotion()) {
      // The finished message is made of new elements, so the animations that were still running
      // on the streaming message carry on from where they were.
      if (!streaming) {
        for (const [index, start] of started) {
          const piece = pieces[index];
          if (piece) animate(piece, start, now);
        }
      }
      for (const piece of fresh) {
        started.set(pieces.indexOf(piece), now);
        animate(piece, now, now);
      }
    }

    if (streaming) {
      shown = pieces.length;
    } else {
      shown = undefined;
      started.clear();
    }
  }

  // The finished message keeps its word spans until the last words have appeared, so that their
  // animations can carry on. After that it is rendered as plain text again.
  const [settled, setSettled] = createSignal(untrack(options.status) !== 'loading');
  let settling: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => clearTimeout(settling));

  createEffect(
    on(
      options.status,
      (status, previous) => {
        clearTimeout(settling);
        if (status === 'loading') {
          shown = 0;
          started.clear();
          setSettled(false);
        } else if (previous === 'loading') {
          const duration = untrack(options.animation).duration ?? 0;
          settling = setTimeout(() => setSettled(true), duration + 100);
        }
      },
      { defer: true },
    ),
  );

  createEffect(() => {
    const element = lane();
    if (!element || !options.pieces()) return;
    // Pieces already on screen, such as those of an answer joined part-way, are not animated.
    shown = untrack(options.status) === 'loading' ? piecesOf(element).length : undefined;
    // The observer reports before the next paint, so a new piece is never seen before it animates.
    const observer = new MutationObserver(reveal);
    observer.observe(element, { childList: true, subtree: true });
    onCleanup(() => observer.disconnect());
  });

  return {
    /** The streaming answer, and the finished one that has just replaced it, need word spans. */
    wordSpans: () => options.pieces() === 'words' && !settled(),
  };
}
