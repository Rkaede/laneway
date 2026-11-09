import { For } from 'solid-js';

import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';

export function Basic() {
  return (
    <div>
      <Dialog>
        <DialogTrigger as={Button} variant="outline">
          Open dialog
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename chat</DialogTitle>
            <DialogDescription>Give this chat a name you will recognise.</DialogDescription>
          </DialogHeader>
          <Input value="Trip to Lisbon" />
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function WithCloseButton() {
  return (
    <div>
      <Dialog>
        <DialogTrigger as={Button} variant="outline">
          Open dialog
        </DialogTrigger>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Close button</DialogTitle>
            <DialogDescription>The corner button dismisses this dialog.</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function Destructive() {
  return (
    <div>
      <Dialog>
        <DialogTrigger as={Button} variant="destructive">
          Delete
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this chat?</DialogTitle>
            <DialogDescription>This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline">Cancel</Button>
            <Button variant="destructive">Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function LongContent() {
  return (
    <div>
      <Dialog>
        <DialogTrigger as={Button} variant="outline">
          Open long dialog
        </DialogTrigger>
        <DialogContent showCloseButton>
          <DialogHeader>
            <DialogTitle>Scrolling content</DialogTitle>
            <DialogDescription>The dialog scrolls inside the viewport.</DialogDescription>
          </DialogHeader>
          <For each={Array.from({ length: 40 }, (_, index) => index + 1)}>
            {(line) => <p class="text-sm">Line {line}</p>}
          </For>
        </DialogContent>
      </Dialog>
    </div>
  );
}
