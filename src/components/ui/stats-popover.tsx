import { formatDateLong, formatResponseTime } from '~/util';

import { IconChartNoAxesColumn } from '../icons/ui';
import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

interface StatsPopoverProps {
  stats?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    created?: number;
    timeTaken?: number;
  };
}

export function StatsPopoverContent(props: StatsPopoverProps) {
  return (
    <ul class="grid grid-cols-1 gap-3 text-xs whitespace-nowrap">
      <li class="grid gap-0.5">
        <span class="text-muted">Time Taken</span>
        <span class="font-medium">
          {props.stats?.timeTaken ? formatResponseTime(props.stats?.timeTaken) : '-'}
        </span>
      </li>
      <li class="grid gap-0.5">
        <span class="text-muted">Tokens</span>
        <span class="font-medium">
          {props.stats?.promptTokens &&
          props.stats?.completionTokens &&
          props.stats?.totalTokens ? (
            <div>
              {props.stats?.totalTokens} ({props.stats?.promptTokens} input /{' '}
              {props.stats?.completionTokens} output)
            </div>
          ) : (
            '-'
          )}
        </span>
      </li>
      <li class="grid gap-0.5">
        <span class="text-muted">Created</span>
        <span class="font-medium">
          {props.stats?.created ? formatDateLong(new Date(props.stats?.created)) : '-'}
        </span>
      </li>
    </ul>
  );
}

export function StatsPopover(props: StatsPopoverProps) {
  return (
    <Popover>
      <Button
        as={PopoverTrigger}
        variant="toolbar"
        size="toolbar"
        aria-label="View message statistics"
      >
        <IconChartNoAxesColumn class="size-4" />
      </Button>
      <PopoverContent class="w-auto p-3 pr-9" aria-label="Message statistics">
        <StatsPopoverContent {...props} />
      </PopoverContent>
    </Popover>
  );
}
