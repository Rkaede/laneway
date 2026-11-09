import { createSignal } from 'solid-js';

import { Button } from '~/components/ui/button';
import { SidebarIcon } from '~/components/ui/sidebar-icon';

import { Cell, CellHeader, Cells } from './story-components';

export function States() {
  return (
    <Cells>
      <Cell>
        <CellHeader>Open (hover to see the arrow)</CellHeader>
        <SidebarIcon open />
      </Cell>
      <Cell>
        <CellHeader>Closed (hover to see the arrow)</CellHeader>
        <SidebarIcon open={false} />
      </Cell>
    </Cells>
  );
}

export function Toggle() {
  const [open, setOpen] = createSignal(true);

  return (
    <div>
      <Button
        variant="ghost"
        size="icon"
        aria-label="Toggle sidebar"
        onClick={() => setOpen((value) => !value)}
      >
        <SidebarIcon open={open()} />
      </Button>
    </div>
  );
}
