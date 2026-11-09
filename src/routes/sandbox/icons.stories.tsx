import { type Component, For } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import * as CreatorIcons from '~/components/icons/creators';
import * as ModelIcons from '~/components/icons/models';
import * as Icon from '~/components/icons/ui';

function IconGrid(props: { icons: Record<string, Component<{ class?: string }>> }) {
  return (
    <div class="grid w-full grid-cols-6 gap-2 gap-y-8">
      <For each={Object.entries(props.icons)}>
        {([name, icon]) => (
          <div class="flex flex-col items-center gap-2">
            <Dynamic component={icon} class="size-6" />
            <div class="text-xs">{name}</div>
          </div>
        )}
      </For>
    </div>
  );
}

export function Icons() {
  return <IconGrid icons={Icon} />;
}

export function Creators() {
  return <IconGrid icons={CreatorIcons} />;
}

export function Models() {
  return <IconGrid icons={ModelIcons} />;
}
