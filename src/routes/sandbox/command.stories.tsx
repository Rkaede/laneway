import { createSignal } from 'solid-js';

import { IconChat, IconSearch, IconSettings, IconSquarePen } from '~/components/icons/ui';
import { Button } from '~/components/ui/button';
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from '~/components/ui/command';

function Items() {
  return (
    <>
      <CommandGroup heading="Actions">
        <CommandItem value="new-chat" class="gap-2">
          <IconChat class="size-4" />
          New chat
          <CommandShortcut>⌘N</CommandShortcut>
        </CommandItem>
        <CommandItem value="new-note" class="gap-2">
          <IconSquarePen class="size-4" />
          New note
        </CommandItem>
        <CommandItem value="search" class="gap-2" disabled>
          <IconSearch class="size-4" />
          Search (disabled)
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="App">
        <CommandItem value="settings" class="gap-2">
          <IconSettings class="size-4" />
          Settings
          <CommandShortcut>⌘,</CommandShortcut>
        </CommandItem>
      </CommandGroup>
    </>
  );
}

export function Inline() {
  return (
    <div class="w-96 rounded-card border shadow-md">
      <Command>
        <CommandInput placeholder="Search commands..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <Items />
        </CommandList>
      </Command>
    </div>
  );
}

export function EmptyResults() {
  return (
    <div class="w-96 rounded-card border shadow-md">
      <Command>
        <CommandInput placeholder="Search commands..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
        </CommandList>
      </Command>
    </div>
  );
}

export function InDialog() {
  const [open, setOpen] = createSignal(false);

  return (
    <div>
      <Button variant="outline" onClick={() => setOpen(true)}>
        Open command dialog
      </Button>
      <CommandDialog
        open={open()}
        onOpenChange={setOpen}
        filter={(value, search) => (value.toLowerCase().includes(search.toLowerCase()) ? 1 : 0)}
      >
        <CommandInput placeholder="Search commands..." />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <Items />
        </CommandList>
      </CommandDialog>
    </div>
  );
}
