import { Toast, toaster } from '@kobalte/core/toast';
import { onCleanup, onMount } from 'solid-js';

import { Button } from './button';
import { setNotifier } from './notify';

export { showSuccess } from './notify';

function show(message: string) {
  toaster.show((props) => (
    <Toast
      toastId={props.toastId}
      priority="low"
      class="flex items-center justify-between gap-4 rounded-card border bg-surface-raised p-4 text-sm text-main shadow-lg"
    >
      <Toast.Title>{message}</Toast.Title>
      <Toast.CloseButton
        as={Button}
        variant="ghost"
        size="sm"
        aria-label="Dismiss notification"
      >
        Dismiss
      </Toast.CloseButton>
    </Toast>
  ));
}

export function Notifications() {
  onMount(() => setNotifier(show));
  onCleanup(() => setNotifier(undefined));

  return (
    <Toast.Region duration={5000} limit={3} topLayer>
      <Toast.List class="fixed right-4 bottom-4 z-[var(--z-toast)] flex w-96 max-w-[calc(100vw-2rem)] flex-col gap-2 outline-hidden" />
    </Toast.Region>
  );
}
