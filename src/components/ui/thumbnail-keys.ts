/**
 * Keydown handler for the thumbnail, which acts as a button that opens the preview. Keys
 * pressed on a control inside it (the Remove button) bubble up to it and must not open the
 * preview.
 */
export function openPreviewOnKey(event: KeyboardEvent, openPreview: () => void) {
  if (event.target !== event.currentTarget) return;
  if (event.key !== 'Enter' && event.key !== ' ') return;
  // Space would otherwise scroll the page.
  if (event.key === ' ') event.preventDefault();
  openPreview();
}
