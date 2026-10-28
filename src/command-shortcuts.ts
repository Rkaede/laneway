export function shouldIgnoreShortcut(event: KeyboardEvent) {
  return (
    event.defaultPrevented ||
    (event.target instanceof Element &&
      event.target.closest(
        'input, textarea, select, [contenteditable="true"], .cm-editor, [role="combobox"], [role="listbox"], [role="menu"], [aria-haspopup="listbox"], [aria-haspopup="menu"], [aria-haspopup="true"]',
      ) !== null)
  );
}
