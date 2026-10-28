import { describe, expect, it } from 'bun:test';

import { getSwipeDirection } from './swipe';

const start = { clientX: 200, clientY: 200 };

describe('lightbox swipe direction', () => {
  it('advances on a left swipe and goes back on a right swipe', () => {
    expect(getSwipeDirection(start, { clientX: 100, clientY: 210 })).toBe('next');
    expect(getSwipeDirection(start, { clientX: 300, clientY: 190 })).toBe('previous');
  });

  it('ignores taps and horizontal movement below the threshold', () => {
    expect(getSwipeDirection(start, start)).toBeUndefined();
    expect(getSwipeDirection(start, { clientX: 151, clientY: 200 })).toBeUndefined();
    expect(getSwipeDirection(start, { clientX: 249, clientY: 200 })).toBeUndefined();
  });

  it('accepts horizontal swipes at the threshold', () => {
    expect(getSwipeDirection(start, { clientX: 150, clientY: 200 })).toBe('next');
    expect(getSwipeDirection(start, { clientX: 250, clientY: 200 })).toBe('previous');
  });

  it('ignores vertical and equally diagonal gestures', () => {
    expect(getSwipeDirection(start, { clientX: 200, clientY: 300 })).toBeUndefined();
    expect(getSwipeDirection(start, { clientX: 140, clientY: 300 })).toBeUndefined();
    expect(getSwipeDirection(start, { clientX: 260, clientY: 100 })).toBeUndefined();
    expect(getSwipeDirection(start, { clientX: 300, clientY: 300 })).toBeUndefined();
  });
});
