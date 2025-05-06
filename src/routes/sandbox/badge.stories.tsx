import { For } from 'solid-js';

import { Badge } from '~/components/ui/badge';

import { Cell, Cells } from './story-components';

const variants = [
  'free',
  'reasoning',
  'new',
  'vision',
  'online',
  'preset',
  'model',
  'assistant',
] as const;

export function Default() {
  return (
    <Cells class="grid-cols-4">
      <For each={variants}>
        {(variant) => (
          <Cell>
            <Badge variant={variant}>{variant}</Badge>
          </Cell>
        )}
      </For>
    </Cells>
  );
}

export function Subtle() {
  return (
    <Cells class="grid-cols-4">
      <For each={variants}>
        {(variant) => (
          <Cell>
            <Badge variant={variant} subtle>
              {variant}
            </Badge>
          </Cell>
        )}
      </For>
    </Cells>
  );
}

export function NoIcon() {
  return (
    <Cells class="grid-cols-4">
      <For each={variants}>
        {(variant) => (
          <Cell>
            <Badge variant={variant} showIcon={false}>
              {variant}
            </Badge>
          </Cell>
        )}
      </For>
    </Cells>
  );
}

export function WithCustomClass() {
  return (
    <Cells class="grid-cols-1">
      <Cell>
        <Badge variant="free" class="px-4 py-1 text-lg">
          Large Free
        </Badge>
      </Cell>
    </Cells>
  );
}
