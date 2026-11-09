import { Separator } from '~/components/ui/separator';

import { Cell, CellHeader, Cells } from './story-components';

export function Orientations() {
  return (
    <Cells class="max-w-sm">
      <Cell>
        <CellHeader>Horizontal</CellHeader>
        <Separator />
      </Cell>
      <Cell>
        <CellHeader>Vertical</CellHeader>
        <div class="flex h-6 items-center gap-3 text-sm">
          Left
          <Separator orientation="vertical" />
          Right
        </div>
      </Cell>
    </Cells>
  );
}
