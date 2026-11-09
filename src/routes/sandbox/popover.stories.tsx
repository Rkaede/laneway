import { For } from 'solid-js';

import { Button } from '~/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover';

export function Default() {
  return (
    <div>
      <Popover>
        <PopoverTrigger as={Button} variant="outline">
          Open popover
        </PopoverTrigger>
        <PopoverContent>Popover content goes here.</PopoverContent>
      </Popover>
    </div>
  );
}

export function WithCloseButton() {
  return (
    <div>
      <Popover>
        <PopoverTrigger as={Button} variant="outline">
          Open popover
        </PopoverTrigger>
        <PopoverContent showCloseButton class="pr-9">
          This one has a close button.
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function Placements() {
  return (
    <div class="flex gap-2">
      <For each={['top', 'right', 'bottom', 'left'] as const}>
        {(placement) => (
          <Popover placement={placement}>
            <PopoverTrigger as={Button} variant="outline" class="capitalize">
              {placement}
            </PopoverTrigger>
            <PopoverContent>Placed on the {placement}.</PopoverContent>
          </Popover>
        )}
      </For>
    </div>
  );
}
