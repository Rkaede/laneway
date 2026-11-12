import { IconSplit } from '~/components/icons/ui';
import { Button } from '~/components/ui/button';

export function ForkButton(props: { onClick: () => void }) {
  return (
    <Button
      variant="toolbar"
      size="toolbar"
      onClick={() => props.onClick()}
      title="Fork from here"
      aria-label="Fork from here"
    >
      {/* Flipped so the arrows point down, the way a conversation runs. */}
      <IconSplit class="size-4 -scale-y-100" />
    </Button>
  );
}
