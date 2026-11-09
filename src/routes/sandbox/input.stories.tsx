import { Input } from '~/components/ui/input';

import { Cell, CellHeader, Cells } from './story-components';

export function States() {
  return (
    <Cells class="max-w-sm">
      <Cell>
        <CellHeader>Empty</CellHeader>
        <Input />
      </Cell>
      <Cell>
        <CellHeader>Placeholder</CellHeader>
        <Input placeholder="Search..." />
      </Cell>
      <Cell>
        <CellHeader>With value</CellHeader>
        <Input value="Trip to Lisbon" />
      </Cell>
      <Cell>
        <CellHeader>Disabled</CellHeader>
        <Input value="Cannot edit" disabled />
      </Cell>
      <Cell>
        <CellHeader>Read only</CellHeader>
        <Input value="Read only" readOnly />
      </Cell>
      <Cell>
        <CellHeader>Invalid</CellHeader>
        <Input value="not-a-key" aria-invalid />
      </Cell>
    </Cells>
  );
}

export function Types() {
  return (
    <Cells class="max-w-sm">
      <Cell>
        <CellHeader>Password</CellHeader>
        <Input type="password" value="sk-or-secret" />
      </Cell>
      <Cell>
        <CellHeader>Number</CellHeader>
        <Input type="number" value="42" />
      </Cell>
      <Cell>
        <CellHeader>File</CellHeader>
        <Input type="file" />
      </Cell>
    </Cells>
  );
}
