import { Button } from '~/components/ui/button';

import { Cell, CellHeader, Cells } from './story-components';

export function Variants() {
  return (
    <Cells>
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
        <CellHeader>Link</CellHeader>
        <Button variant="link">Link</Button>
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
        <Button size="icon">+</Button>
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
    </Cells>
  );
}
