import { Input } from '~/components/ui/input';
import { Label, Price, Tokens } from '~/components/ui/text';

import { Cell, CellHeader, Cells } from './story-components';

export function Labels() {
  return (
    <Cells class="max-w-sm">
      <Cell>
        <CellHeader>Standalone</CellHeader>
        <Label>Label text</Label>
      </Cell>
      <Cell>
        <CellHeader>With a field</CellHeader>
        <Label class="flex w-full flex-col gap-2">
          Name
          <Input />
        </Label>
      </Cell>
    </Cells>
  );
}

export function TokenCounts() {
  return (
    <Cells>
      <Cell>
        <CellHeader>With a count</CellHeader>
        <Tokens tokens={200000} />
      </Cell>
      <Cell>
        <CellHeader>Unknown</CellHeader>
        <Tokens />
      </Cell>
    </Cells>
  );
}

export function Prices() {
  return (
    <Cells>
      <Cell>
        <CellHeader>Per-token price, shown per million</CellHeader>
        <Price pricing={0.000003} />
      </Cell>
      <Cell>
        <CellHeader>Free</CellHeader>
        <Price pricing={0} />
      </Cell>
      <Cell>
        <CellHeader>Unknown</CellHeader>
        <Price />
      </Cell>
    </Cells>
  );
}
