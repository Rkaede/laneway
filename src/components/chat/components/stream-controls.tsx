import { IconArrowDown, IconListEnd } from '~/components/icons/ui';
import { Button } from '~/components/ui/button';
import { cn } from '~/util';

type FollowToggleProps = {
  following: boolean;
  onToggle: () => void;
  class?: string;
};

/** Lets the reader choose whether a lane keeps its newest output in view. */
export function FollowToggle(props: FollowToggleProps) {
  return (
    <Button
      variant="toolbar"
      size="toolbar"
      class={cn(props.following && 'bg-surface-hover', props.class)}
      aria-pressed={props.following}
      aria-label="Follow output"
      title={props.following ? 'Following output. Click to stop.' : 'Follow output'}
      onClick={props.onToggle}
    >
      <IconListEnd class="size-4" />
    </Button>
  );
}

type JumpToLatestProps = {
  onClick: () => void;
  class?: string;
};

/** Takes the reader back to the newest output of a lane. */
export function JumpToLatest(props: JumpToLatestProps) {
  return (
    <Button variant="outline" size="sm" class={props.class} onClick={props.onClick}>
      <IconArrowDown class="size-3.5" />
      Jump to latest
    </Button>
  );
}
