import './stream-cursor.css';

import type { Component } from 'solid-js';

import type { StreamCursorShape } from './markdown-cursor';

/**
 * A blinking cursor shown while an answer is on its way, before its first text. Markdown draws
 * the same cursor after the text of an answer that is streaming. With reduced motion it stays lit, because
 * Loom's reduced-motion rule ends the animation on its last frame.
 */
export const StreamCursor: Component<{ shape: StreamCursorShape }> = (props) => {
  return (
    <span role="status" class="stream-cursor" data-shape={props.shape}>
      <span class="sr-only">Loading…</span>
    </span>
  );
};
