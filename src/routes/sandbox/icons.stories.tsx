import { For } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import * as Icon from '~/components/icons/ui';

export function Icons() {
  const icons = Object.entries(Icon).map(([key, value]) => ({ key, value }));

  return (
    <div class="grid w-full grid-cols-6 gap-2 gap-y-8">
      <For each={icons}>
        {(icon) => (
          <div class="flex flex-col items-center gap-2">
            <Dynamic component={icon.value} />
            <div class="text-xs">{icon.key}</div>
          </div>
        )}
      </For>
    </div>
  );
}
