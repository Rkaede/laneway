interface FocusSourceTarget extends EventTarget {
  readonly documentElement: Pick<HTMLElement, 'dataset'>;
}

/**
 * Marks <html> with `data-focus-source="keyboard"` after a Tab press and `"pointer"` after a
 * click or touch. Text fields match `:focus-visible` however they were focused, so field styles
 * read this to show the focus ring only to keyboard users.
 */
export function trackFocusSource(target: FocusSourceTarget) {
  const root = target.documentElement;
  target.addEventListener(
    'keydown',
    (event) => {
      if ((event as KeyboardEvent).key === 'Tab') root.dataset.focusSource = 'keyboard';
    },
    true,
  );
  target.addEventListener(
    'pointerdown',
    () => {
      root.dataset.focusSource = 'pointer';
    },
    true,
  );
}
