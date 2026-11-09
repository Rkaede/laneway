import { For } from 'solid-js';

import { ScrollPanel } from '~/components/ui/scrollpanel';

function Lines() {
  return (
    <For each={Array.from({ length: 30 }, (_, index) => index + 1)}>
      {(line) => <p class="px-3 text-sm">Line {line}</p>}
    </For>
  );
}

export function Default() {
  return (
    <div class="h-48 w-64 overflow-hidden rounded-md border bg-surface">
      <ScrollPanel class="h-48">
        <Lines />
      </ScrollPanel>
    </div>
  );
}

export function FadeBottom() {
  return (
    <div class="h-48 w-64 overflow-hidden rounded-md border bg-surface">
      <ScrollPanel class="h-48" fadeBottom>
        <Lines />
      </ScrollPanel>
    </div>
  );
}

export function Debug() {
  return (
    <div class="h-48 w-64 overflow-hidden rounded-md border bg-surface">
      <ScrollPanel class="h-48" debug>
        <Lines />
      </ScrollPanel>
    </div>
  );
}
