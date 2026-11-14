import { describe, expect, it } from 'bun:test';

import { trackFocusSource } from './focus-source';

function createTarget() {
  return Object.assign(new EventTarget(), {
    documentElement: { dataset: {} as DOMStringMap },
  });
}

function keydown(key: string) {
  return Object.assign(new Event('keydown'), { key });
}

describe('trackFocusSource', () => {
  it('marks keyboard focus after Tab and pointer focus after a click', () => {
    const target = createTarget();
    trackFocusSource(target);
    expect(target.documentElement.dataset.focusSource).toBeUndefined();

    target.dispatchEvent(keydown('Tab'));
    expect(target.documentElement.dataset.focusSource).toBe('keyboard');

    target.dispatchEvent(new Event('pointerdown'));
    expect(target.documentElement.dataset.focusSource).toBe('pointer');
  });

  it('ignores typing, so a clicked field keeps its pointer focus', () => {
    const target = createTarget();
    trackFocusSource(target);
    target.dispatchEvent(new Event('pointerdown'));

    target.dispatchEvent(keydown('a'));
    expect(target.documentElement.dataset.focusSource).toBe('pointer');
  });
});
