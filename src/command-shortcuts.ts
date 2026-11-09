const controls =
  'input, textarea, select, [contenteditable="true"], .cm-editor, [role="combobox"], [role="listbox"], [role="menu"], [aria-haspopup="listbox"], [aria-haspopup="menu"], [aria-haspopup="true"]';
const dialogs = '[role="dialog"], [role="alertdialog"]';

export function shouldIgnoreShortcut(event: KeyboardEvent) {
  return (
    event.defaultPrevented ||
    (event.target instanceof Element &&
      event.target.closest(`${controls}, ${dialogs}`) !== null) ||
    // An open dialog owns the keyboard even with focus outside it: the image lightbox never
    // takes focus.
    (typeof document !== 'undefined' && document.querySelector(dialogs) !== null)
  );
}
