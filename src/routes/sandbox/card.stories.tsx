import { createSignal } from 'solid-js';

import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';

import { Cell, CellHeader, Cells } from './story-components';

export function Variants() {
  return (
    <Cells class="max-w-sm">
      <Cell>
        <CellHeader>Default</CellHeader>
        <Card class="w-full">
          <CardHeader>
            <CardTitle>Default</CardTitle>
          </CardHeader>
          <CardContent>A static container.</CardContent>
        </Card>
      </Cell>
      <Cell>
        <CellHeader>Solid (hover for the emphasised border)</CellHeader>
        <Card variant="solid" class="w-full">
          <CardHeader>
            <CardTitle>Solid</CardTitle>
          </CardHeader>
          <CardContent>Used for cards that can be picked.</CardContent>
        </Card>
      </Cell>
    </Cells>
  );
}

export function Clickable() {
  const [clicks, setClicks] = createSignal(0);

  return (
    <Card variant="solid" class="max-w-sm" onClick={() => setClicks((count) => count + 1)}>
      <CardHeader>
        <CardTitle>Click me</CardTitle>
      </CardHeader>
      <CardContent>Clicks: {clicks()}</CardContent>
    </Card>
  );
}

export function Parts() {
  return (
    <Cells class="max-w-sm">
      <Cell>
        <CellHeader>Header only</CellHeader>
        <Card class="w-full">
          <CardHeader>
            <CardTitle>Title</CardTitle>
          </CardHeader>
        </Card>
      </Cell>
      <Cell>
        <CellHeader>Content only</CellHeader>
        <Card class="w-full">
          <CardContent class="pt-6">No header above this content.</CardContent>
        </Card>
      </Cell>
    </Cells>
  );
}
