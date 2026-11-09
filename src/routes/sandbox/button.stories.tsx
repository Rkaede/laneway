import { IconChevronsUpDown, IconDownload, IconPlus, IconX } from '~/components/icons/ui';
import { Button } from '~/components/ui/button';

import { Cell, CellHeader, Cells } from './story-components';

export function Variants() {
  return (
    <Cells class="grid-cols-3">
      <Cell>
        <CellHeader>Default</CellHeader>
        <Button>Default</Button>
      </Cell>
      <Cell>
        <CellHeader>Destructive</CellHeader>
        <Button variant="destructive">Destructive</Button>
      </Cell>
      <Cell>
        <CellHeader>Outline</CellHeader>
        <Button variant="outline">Outline</Button>
      </Cell>
      <Cell>
        <CellHeader>Secondary</CellHeader>
        <Button variant="secondary">Secondary</Button>
      </Cell>
      <Cell>
        <CellHeader>Ghost</CellHeader>
        <Button variant="ghost">Ghost</Button>
      </Cell>
      <Cell>
        <CellHeader>Bare</CellHeader>
        <Button variant="bare">Bare</Button>
      </Cell>
      <Cell>
        <CellHeader>Link</CellHeader>
        <Button variant="link">Link</Button>
      </Cell>
      <Cell>
        <CellHeader>Toolbar</CellHeader>
        <Button variant="toolbar" size="toolbar" aria-label="Add">
          <IconPlus class="size-4" />
        </Button>
      </Cell>
      <Cell>
        <CellHeader>Combobox</CellHeader>
        <Button variant="combobox" class="w-48">
          Select item...
          <IconChevronsUpDown class="size-4 shrink-0 opacity-50" />
        </Button>
      </Cell>
      <Cell>
        <CellHeader>Close (for use over media)</CellHeader>
        <div class="rounded-md bg-media-backdrop p-2">
          <Button variant="close" aria-label="Close">
            <IconX class="size-5" />
          </Button>
        </div>
      </Cell>
    </Cells>
  );
}

export function Sizes() {
  return (
    <Cells>
      <Cell>
        <CellHeader>Default</CellHeader>
        <Button>Default</Button>
      </Cell>
      <Cell>
        <CellHeader>Small</CellHeader>
        <Button size="sm">Small</Button>
      </Cell>
      <Cell>
        <CellHeader>Large</CellHeader>
        <Button size="lg">Large</Button>
      </Cell>
      <Cell>
        <CellHeader>Icon</CellHeader>
        <Button size="icon" aria-label="Add">
          <IconPlus />
        </Button>
      </Cell>
      <Cell>
        <CellHeader>Toolbar</CellHeader>
        <Button size="toolbar" variant="outline" aria-label="Add">
          <IconPlus class="size-4" />
        </Button>
      </Cell>
    </Cells>
  );
}

export function WithIcons() {
  return (
    <Cells>
      <Cell>
        <CellHeader>Leading icon</CellHeader>
        <Button>
          <IconPlus />
          New chat
        </Button>
      </Cell>
      <Cell>
        <CellHeader>Trailing icon</CellHeader>
        <Button variant="outline">
          Download
          <IconDownload />
        </Button>
      </Cell>
      <Cell>
        <CellHeader>Small, with a smaller icon</CellHeader>
        <Button size="sm" variant="secondary">
          <IconPlus />
          Add
        </Button>
      </Cell>
    </Cells>
  );
}

export function States() {
  return (
    <Cells>
      <Cell>
        <CellHeader>Default</CellHeader>
        <Button>Default</Button>
      </Cell>
      <Cell>
        <CellHeader>Disabled</CellHeader>
        <Button disabled>Disabled</Button>
      </Cell>
      <Cell>
        <CellHeader>Invalid</CellHeader>
        <Button variant="outline" aria-invalid>
          Invalid
        </Button>
      </Cell>
    </Cells>
  );
}

export function AsLink() {
  return (
    <Button as="a" href="/sandbox/button" variant="outline" class="self-start">
      Renders an anchor
    </Button>
  );
}
