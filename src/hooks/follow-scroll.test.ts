import { describe, expect, it } from 'bun:test';

import {
  BOTTOM_THRESHOLD,
  bottomScrollTop,
  distanceFromBottom,
  followAfterScroll,
  FOLLOWING,
  scrollTopForOffset,
  topOffset,
} from './follow-scroll';

const metrics = { scrollTop: 0, scrollHeight: 1000, clientHeight: 400 };

describe('scroll measurements', () => {
  it('measures a reversed container from scrollTop 0 at the bottom', () => {
    expect(distanceFromBottom(metrics, true)).toBe(0);
    expect(distanceFromBottom({ ...metrics, scrollTop: -250 }, true)).toBe(250);
    expect(topOffset({ ...metrics, scrollTop: -250 }, true)).toBe(350);
    expect(bottomScrollTop(metrics, true)).toBe(0);
  });

  it('measures a regular container from the top', () => {
    expect(distanceFromBottom({ ...metrics, scrollTop: 600 }, false)).toBe(0);
    expect(distanceFromBottom({ ...metrics, scrollTop: 100 }, false)).toBe(500);
    expect(topOffset({ ...metrics, scrollTop: 100 }, false)).toBe(100);
    expect(bottomScrollTop(metrics, false)).toBe(600);
  });

  it.each([true, false])(
    'restores the reading position after growth (reverse: %s)',
    (reverse) => {
      const before = { ...metrics, scrollTop: reverse ? -250 : 350 };
      const offset = topOffset(before, reverse);
      const grown = { ...before, scrollHeight: 1300 };

      const restored = scrollTopForOffset(offset, grown, reverse);

      expect(topOffset({ ...grown, scrollTop: restored }, reverse)).toBe(offset);
    },
  );
});

describe('followAfterScroll', () => {
  const at = (distance: number, height = 1000) => ({ distance, height });

  it('pauses when the reader scrolls away from the bottom', () => {
    expect(followAfterScroll(FOLLOWING, at(0), at(BOTTOM_THRESHOLD + 1))).toEqual({
      following: false,
    });
  });

  it('keeps following for a small scroll near the bottom', () => {
    expect(followAfterScroll(FOLLOWING, at(0), at(BOTTOM_THRESHOLD))).toBe(FOLLOWING);
  });

  it('does not pause when the distance only grew because the content did', () => {
    expect(followAfterScroll(FOLLOWING, at(0, 1000), at(300, 1300))).toBe(FOLLOWING);
  });

  it('does not pause when the reader scrolls toward the bottom', () => {
    expect(followAfterScroll(FOLLOWING, at(400), at(200))).toBe(FOLLOWING);
  });

  it('resumes when the reader scrolls back to the bottom', () => {
    const paused = { following: false };
    expect(followAfterScroll(paused, at(300), at(10))).toEqual(FOLLOWING);
  });

  it('stays paused while the reader is still above the bottom', () => {
    const paused = { following: false };
    expect(followAfterScroll(paused, at(300), at(200))).toBe(paused);
  });
});
