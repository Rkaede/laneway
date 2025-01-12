import { formatDateLong, formatResponseTime } from '~/util';

import { IconChartNoAxesColumn } from '../icons/ui';
import { Button } from './button';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './hover-card';

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
    <ul class="grid grid-cols-1 gap-3 whitespace-nowrap text-xs">
      <li class="grid gap-0.5">
        <span class="text-muted-foreground">Time Taken</span>
        <span class="font-medium">
          {props.stats?.timeTaken ? formatResponseTime(props.stats?.timeTaken) : '-'}
        </span>
      </li>
      <li class="grid gap-0.5">
        <span class="text-muted-foreground">Tokens</span>
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
        <span class="text-muted-foreground">Created</span>
        <span class="font-medium">
          {props.stats?.created ? formatDateLong(new Date(props.stats?.created)) : '-'}
        </span>
      </li>
    </ul>
  );
}

export function StatsPopover(props: StatsPopoverProps) {
  return (
    <HoverCard>
      <HoverCardTrigger href="#">
        <Button
          variant="toolbar"
          size="toolbar"
          class="cursor-default"
          as="div"
          aria-label="View message statistics"
        >
          <IconChartNoAxesColumn class="size-4" />
        </Button>
      </HoverCardTrigger>
      <HoverCardContent class="w-auto p-3">
        <StatsPopoverContent {...props} />
      </HoverCardContent>
    </HoverCard>
  );
}
