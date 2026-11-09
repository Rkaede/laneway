import { For } from 'solid-js';

import { IconRocket } from '~/components/icons/ui';
import { Tag } from '~/components/ui/tag';

import { Cell, CellHeader, Cells } from './story-components';

const roles = [
  'free',
  'reasoning',
  'new',
  'vision',
  'online',
  'preset',
  'model',
  'assistant',
] as const;

const general = [
  'default',
  'secondary',
  'outline',
  'blue',
  'green',
  'red',
  'warning',
  'note',
  'purple',
] as const;

export function Roles() {
  return (
    <Cells class="grid-cols-4">
      <For each={roles}>
        {(variant) => (
          <Cell>
            <Tag variant={variant}>{variant}</Tag>
          </Cell>
        )}
      </For>
    </Cells>
  );
}

export function General() {
  return (
    <Cells class="grid-cols-4">
      <For each={general}>
        {(variant) => (
          <Cell>
            <Tag variant={variant}>{variant}</Tag>
          </Cell>
        )}
      </For>
    </Cells>
  );
}

export function Icons() {
  return (
    <Cells>
      <Cell>
        <CellHeader>Built in for note and online</CellHeader>
        <div class="flex gap-2">
          <Tag variant="note">Note</Tag>
          <Tag variant="online">Online</Tag>
        </div>
      </Cell>
      <Cell>
        <CellHeader>Custom</CellHeader>
        <Tag variant="secondary" icon={<IconRocket class="size-3" />}>
          Custom icon
        </Tag>
      </Cell>
    </Cells>
  );
}
