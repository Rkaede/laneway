import { IconArrowDown } from '~/components/icons/ui';
import { Button } from '~/components/ui/button';

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
