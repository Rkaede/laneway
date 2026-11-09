import { For } from 'solid-js';

import { IconBadge } from '~/components/ui/icon-badge';

import { Cell, Cells } from './story-components';
import { ROLES } from './story-fixtures';

export function CustomClass() {
  return (
    <Cells class="grid-cols-1">
      <Cell>
        <IconBadge variant="free" class="rounded-full border p-3" />
      </Cell>
    </Cells>
  );
}

export function Variants() {
  return (
    <Cells class="grid-cols-4">
      <For each={ROLES}>
        {(variant) => (
          <Cell>
            <IconBadge variant={variant} label={variant} />
          </Cell>
        )}
      </For>
    </Cells>
  );
}
