import { createSignal, Show } from 'solid-js';

import { DeleteButton } from '~/components/ui/delete-button';

export function Default() {
  const [deleted, setDeleted] = createSignal(false);

  return (
    <div class="flex w-64 items-center justify-between rounded-md border px-3 py-2 text-sm">
      <Show when={!deleted()} fallback="Deleted">
        Hover the button
        <DeleteButton onClick={() => setDeleted(true)} />
      </Show>
    </div>
  );
}
