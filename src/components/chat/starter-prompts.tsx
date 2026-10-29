import { For } from 'solid-js';

import { cn } from '~/util';

const PROMPTS = [
  'Explain compound interest simply',
  'Write a polite follow-up email',
  'Plan a three-day city trip',
  'Compare Python and Go for a CLI',
];

/** Suggestions for a first chat. Picking one fills the composer so it can be edited first. */
export function StarterPrompts(props: { onPick: (prompt: string) => void; class?: string }) {
  return (
    <ul
      aria-label="Starter prompts"
      class={cn('mx-auto flex max-w-[534px] flex-wrap justify-center gap-2', props.class)}
    >
      <For each={PROMPTS}>
        {(prompt) => (
          <li>
            <button
              type="button"
              class="rounded-full border bg-surface-raised px-3 py-1 text-sm text-muted transition-colors hover:bg-surface-hover hover:text-main"
              onClick={() => props.onPick(prompt)}
            >
              {prompt}
            </button>
          </li>
        )}
      </For>
    </ul>
  );
}
