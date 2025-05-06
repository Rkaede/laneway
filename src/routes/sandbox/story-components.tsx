import { ParentComponent } from 'solid-js';

import { cn } from '~/util';

export const Cells: ParentComponent<{ class?: string }> = (props) => {
  return <div class={cn('grid grid-flow-row gap-4', props.class)}>{props.children}</div>;
};

export const Cell: ParentComponent = (props) => {
  return <div class="flex flex-col items-start gap-2">{props.children}</div>;
};

export const CellHeader: ParentComponent = (props) => {
  return <div class="text-foreground-subtle text-xs">{props.children}</div>;
};
