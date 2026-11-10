// Display choices for a streaming answer that are still being compared. Only the sandbox
// playground changes them, and they are not saved.

import { createStore } from 'solid-js/store';

import type { StreamUnit } from './stream-display';

export type StreamAnimation = {
  id: string;
  label: string;
  /** In milliseconds. */
  duration?: number;
  /** Left out when new text simply appears. */
  keyframes?: Keyframe[];
};

/** How a word, sentence or paragraph appears when it is shown. */
export const STREAM_ANIMATIONS: StreamAnimation[] = [
  {
    id: 'blur',
    label: 'Blur',
    duration: 400,
    keyframes: [{ filter: 'blur(6px)' }, { filter: 'blur(0)' }],
  },
  { id: 'fade', label: 'Fade', duration: 350, keyframes: [{ opacity: 0 }, { opacity: 1 }] },
  {
    id: 'fade-blur',
    label: 'Fade & Blur',
    duration: 450,
    keyframes: [
      { opacity: 0, filter: 'blur(6px)' },
      { opacity: 1, filter: 'blur(0)' },
    ],
  },
  { id: 'none', label: 'None' },
];

type StreamTrials = {
  /** The id of the animation each display mode uses. */
  animation: Record<StreamUnit, string>;
};

export const defaultStreamTrials = (): StreamTrials => ({
  animation: { live: 'fade', sentences: 'fade', paragraphs: 'fade' },
});

export const [streamTrials, setStreamTrials] = createStore(defaultStreamTrials());

export function streamAnimation(unit: StreamUnit): StreamAnimation {
  const id = streamTrials.animation[unit];
  return (
    STREAM_ANIMATIONS.find((animation) => animation.id === id) ?? STREAM_ANIMATIONS.at(-1)!
  );
}
