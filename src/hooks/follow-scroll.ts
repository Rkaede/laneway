// Pure scroll maths and follow rules for a lane that reads from a scrolling container. Laneway's
// containers are `flex-col-reverse`, where scrollTop is 0 at the bottom and negative above it.

/** Within this many pixels of the end counts as being at the latest output. */
export const BOTTOM_THRESHOLD = 48;

export type ScrollMetrics = { scrollTop: number; scrollHeight: number; clientHeight: number };

export type FollowState = {
  /** The lane keeps its newest output in view. */
  following: boolean;
  /** The reader switched following off themselves, so reaching the bottom will not resume it. */
  locked: boolean;
};

export const FOLLOWING: FollowState = { following: true, locked: false };

export function distanceFromBottom(m: ScrollMetrics, reverse: boolean) {
  return reverse
    ? Math.abs(m.scrollTop)
    : Math.max(0, m.scrollHeight - m.clientHeight - m.scrollTop);
}

/** The distance from the top of the content to the top of the viewport. */
export function topOffset(m: ScrollMetrics, reverse: boolean) {
  return reverse ? m.scrollHeight - m.clientHeight + m.scrollTop : m.scrollTop;
}

/** The scrollTop that puts the viewport `offset` pixels below the top of the content. */
export function scrollTopForOffset(offset: number, m: ScrollMetrics, reverse: boolean) {
  return reverse ? offset - (m.scrollHeight - m.clientHeight) : offset;
}

export function bottomScrollTop(m: ScrollMetrics, reverse: boolean) {
  return reverse ? 0 : m.scrollHeight - m.clientHeight;
}

export type ScrollSample = { distance: number; height: number };

/**
 * Reacts to a scroll event. Moving away from the bottom pauses following, unless the content grew
 * since the last sample, because growth alone moves the distance. Reaching the bottom resumes it.
 */
export function followAfterScroll(
  state: FollowState,
  previous: ScrollSample,
  next: ScrollSample,
  threshold = BOTTOM_THRESHOLD,
): FollowState {
  if (next.distance <= threshold) {
    return state.locked || state.following ? state : FOLLOWING;
  }
  if (state.following && next.distance > previous.distance && next.height === previous.height) {
    return { following: false, locked: false };
  }
  return state;
}

/** The follow toggle. Turning it off is deliberate, so it stays off until turned on again. */
export function toggleFollow(state: FollowState): FollowState {
  return state.following ? { following: false, locked: true } : FOLLOWING;
}
