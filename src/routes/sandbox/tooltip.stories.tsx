import { For } from 'solid-js';

import { IconInfo } from '~/components/icons/ui';
import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';

export function Placements() {
  return (
    <div class="flex gap-2">
      <For each={['top', 'right', 'bottom', 'left'] as const}>
        {(placement) => (
          <Tooltip placement={placement}>
            <TooltipTrigger as={Button} variant="outline" class="capitalize">
              {placement}
            </TooltipTrigger>
            <TooltipContent>Tooltip on the {placement}</TooltipContent>
          </Tooltip>
        )}
      </For>
    </div>
  );
}

export function Triggers() {
  return (
    <div class="flex items-center gap-4">
      <Tooltip>
        <TooltipTrigger as={Button} variant="ghost" size="icon" aria-label="More information">
          <IconInfo class="size-4" />
        </TooltipTrigger>
        <TooltipContent>On an icon button</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger as="span" tabIndex={0} class="text-sm underline underline-offset-4">
          Plain text
        </TooltipTrigger>
        <TooltipContent>On text, reachable with the keyboard</TooltipContent>
      </Tooltip>
    </div>
  );
}
