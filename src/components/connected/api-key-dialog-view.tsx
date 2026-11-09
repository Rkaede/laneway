import type { ParentComponent } from 'solid-js';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { cn } from '~/util';

/** The dialog around the key form, which it takes as its children. */
export const ApiKeyDialogView: ParentComponent<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
}> = (props) => {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent showCloseButton>
        <DialogHeader>
          <DialogTitle>Add an API key</DialogTitle>
          <DialogDescription class="text-sm text-muted">
            Laneway sends your messages straight to the provider with your own key. The key
            stays in this browser.
          </DialogDescription>
        </DialogHeader>
        {props.children}
      </DialogContent>
    </Dialog>
  );
};

/** A line for the composer while no key is set. */
export function KeyNoticeView(props: { onAddKey: () => void; class?: string }) {
  return (
    <p class={cn('text-sm text-muted', props.class)}>
      Add an API key to start chatting.{' '}
      <button
        type="button"
        class="font-medium text-main underline underline-offset-4"
        onClick={() => props.onAddKey()}
      >
        Add key
      </button>
    </p>
  );
}
