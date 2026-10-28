export function confirmDialogDismiss(event: Event, hasChanges: boolean) {
  if (hasChanges && !window.confirm('Discard unsaved changes?')) {
    event.preventDefault();
  }
}
