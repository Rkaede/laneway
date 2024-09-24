import { Component } from 'solid-js';

import { IconX } from '~/components/icons/ui';
import { Button } from '~/components/ui/button';

interface DeleteButtonProps {
  onClick: () => void;
}

export const DeleteButton: Component<DeleteButtonProps> = (props) => {
  return (
    <Button
      size="icon"
      variant="ghost"
      class="size-6 justify-self-end rounded-full p-0 hover:bg-destructive"
      onClick={props.onClick}
    >
      <IconX class="size-4" />
    </Button>
  );
};
