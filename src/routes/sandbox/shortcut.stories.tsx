import { Shortcut } from '~/components/ui/shortcut';

import { Cell, CellHeader, Cells } from './story-components';

export function Variants() {
  return (
    <Cells>
      <Cell>
        <CellHeader>Default</CellHeader>
        <Shortcut>$mod+K</Shortcut>
      </Cell>
      <Cell>
        <CellHeader>Ghost (hover)</CellHeader>
        <Shortcut variant="ghost">$mod+K</Shortcut>
      </Cell>
      <Cell>
        <CellHeader>Solid</CellHeader>
        <Shortcut variant="solid">$mod+K</Shortcut>
      </Cell>
    </Cells>
  );
}

export function Content() {
  return (
    <Cells>
      <Cell>
        <CellHeader>$mod expands to the platform's modifier</CellHeader>
        <Shortcut variant="solid">$mod+Shift+P</Shortcut>
      </Cell>
      <Cell>
        <CellHeader>Plain key</CellHeader>
        <Shortcut variant="solid">Esc</Shortcut>
      </Cell>
      <Cell>
        <CellHeader>Pushed to the end of a row</CellHeader>
        <div class="flex w-64 items-center text-sm">
          New chat
          <Shortcut>$mod+N</Shortcut>
        </div>
      </Cell>
    </Cells>
  );
}
