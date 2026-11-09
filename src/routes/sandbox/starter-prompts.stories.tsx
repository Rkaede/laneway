import { createSignal } from 'solid-js';

import { StarterPrompts } from '~/components/chat/starter-prompts';

export function Default() {
  const [picked, setPicked] = createSignal('');

  return (
    <div class="flex flex-col gap-3">
      <StarterPrompts onPick={setPicked} />
      <p class="text-center text-sm text-muted">Picked: {picked() || 'nothing yet'}</p>
    </div>
  );
}
