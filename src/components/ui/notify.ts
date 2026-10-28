// Plain-TypeScript entry point for success messages, so store actions can report results without
// importing the toast component. The mounted <Notifications /> registers how messages are shown.
type Notifier = (message: string) => void;

let notifier: Notifier | undefined;

export function setNotifier(next: Notifier | undefined) {
  notifier = next;
}

export function showSuccess(message: string) {
  notifier?.(message);
}
