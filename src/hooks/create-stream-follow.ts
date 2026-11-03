import { createSignal, onCleanup, onMount } from 'solid-js';

import {
  BOTTOM_THRESHOLD,
  bottomScrollTop,
  distanceFromBottom,
  followAfterScroll,
  FOLLOWING,
  type FollowState,
  scrollTopForOffset,
  toggleFollow,
  topOffset,
} from './follow-scroll';

export function prefersReducedMotion() {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

function findScroller(element: HTMLElement) {
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    const { overflowY } = getComputedStyle(parent);
    if (overflowY === 'auto' || overflowY === 'scroll') return parent;
  }
}

// Lanes in one session share a scroller, so a lane that is not following only holds the reading
// position while no other lane in that scroller is following.
const followers = new WeakMap<HTMLElement, Set<() => boolean>>();

/**
 * Per-lane control over following new output in the scroller around `lane`. While following, the
 * scroller stays at the latest output. Once the reader scrolls away or turns following off, the
 * reading position stays put as the lane grows.
 */
export function createStreamFollow(lane: () => HTMLElement | undefined) {
  const [state, setState] = createSignal<FollowState>(FOLLOWING);
  const [away, setAway] = createSignal(false);
  let scroller: HTMLElement | undefined;
  let reverse = false;
  let anchor = 0;
  let sample = { distance: 0, height: 0 };

  const metrics = () => scroller!;
  const read = () => ({
    distance: distanceFromBottom(metrics(), reverse),
    height: metrics().scrollHeight,
  });

  function capture() {
    anchor = topOffset(metrics(), reverse);
    sample = read();
    setAway(sample.distance > BOTTOM_THRESHOLD);
  }

  function scrollToBottom(behavior: ScrollBehavior) {
    scroller?.scrollTo({ top: bottomScrollTop(metrics(), reverse), behavior });
    if (behavior === 'auto') capture();
  }

  // Runs whenever the lane changes size.
  function settle() {
    if (!scroller) return;
    const group = followers.get(scroller);
    if (group && [...group].some((isFollowing) => isFollowing())) {
      scrollToBottom('auto');
    } else {
      scroller.scrollTop = scrollTopForOffset(anchor, metrics(), reverse);
      capture();
    }
  }

  function onScroll() {
    const next = read();
    setState((current) => followAfterScroll(current, sample, next));
    capture();
  }

  onMount(() => {
    const element = lane();
    scroller = element && findScroller(element);
    if (!element || !scroller) return;
    const target = scroller;
    reverse = getComputedStyle(target).flexDirection === 'column-reverse';
    capture();

    const group = followers.get(target) ?? new Set<() => boolean>();
    const isFollowing = () => state().following;
    group.add(isFollowing);
    followers.set(target, group);

    target.addEventListener('scroll', onScroll, { passive: true });
    const observer = new ResizeObserver(settle);
    observer.observe(element);
    onCleanup(() => {
      target.removeEventListener('scroll', onScroll);
      observer.disconnect();
      group.delete(isFollowing);
    });
  });

  return {
    following: () => state().following,
    /** The reader is not at the latest output. */
    away,
    toggle() {
      const next = toggleFollow(state());
      setState(next);
      if (next.following) scrollToBottom('auto');
    },
    /** Resume following and scroll to the newest output, without animation if motion is reduced. */
    jump() {
      setState(FOLLOWING);
      scrollToBottom(prefersReducedMotion() ? 'auto' : 'smooth');
    },
    /** Stop following and bring the top of an element into view, to read an answer from its start. */
    revealFromStart(element: Element | null | undefined) {
      if (!scroller || !element) return;
      setState({ following: false, locked: false });
      element.scrollIntoView({ block: 'start', behavior: 'auto' });
      capture();
    },
  };
}
