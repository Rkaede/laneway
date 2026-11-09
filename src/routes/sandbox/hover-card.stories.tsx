import { HoverCard, HoverCardContent, HoverCardTrigger } from '~/components/ui/hover-card';

import { Cell, CellHeader, Cells } from './story-components';

const trigger = 'text-sm text-main underline underline-offset-4';

export function Default() {
  return (
    <HoverCard>
      <HoverCardTrigger href="/sandbox/hover-card" class={trigger}>
        Hover this link
      </HoverCardTrigger>
      <HoverCardContent>
        <p class="font-medium">Hover card</p>
        <p class="text-sm text-muted">Extra detail that appears on hover.</p>
      </HoverCardContent>
    </HoverCard>
  );
}

export function Placements() {
  return (
    <Cells class="grid-cols-4">
      <Cell>
        <CellHeader>Top</CellHeader>
        <HoverCard placement="top">
          <HoverCardTrigger href="/sandbox/hover-card" class={trigger}>
            Top
          </HoverCardTrigger>
          <HoverCardContent>Placed above the trigger.</HoverCardContent>
        </HoverCard>
      </Cell>
      <Cell>
        <CellHeader>Right</CellHeader>
        <HoverCard placement="right">
          <HoverCardTrigger href="/sandbox/hover-card" class={trigger}>
            Right
          </HoverCardTrigger>
          <HoverCardContent>Placed to the right of the trigger.</HoverCardContent>
        </HoverCard>
      </Cell>
      <Cell>
        <CellHeader>Bottom</CellHeader>
        <HoverCard placement="bottom">
          <HoverCardTrigger href="/sandbox/hover-card" class={trigger}>
            Bottom
          </HoverCardTrigger>
          <HoverCardContent>Placed below the trigger.</HoverCardContent>
        </HoverCard>
      </Cell>
      <Cell>
        <CellHeader>Left</CellHeader>
        <HoverCard placement="left">
          <HoverCardTrigger href="/sandbox/hover-card" class={trigger}>
            Left
          </HoverCardTrigger>
          <HoverCardContent>Placed to the left of the trigger.</HoverCardContent>
        </HoverCard>
      </Cell>
    </Cells>
  );
}
