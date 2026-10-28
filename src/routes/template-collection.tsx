import { createSignal, For, type JSX, Show } from 'solid-js';

import {
  IconCheck,
  IconGallery,
  IconPlus,
  IconSearch,
  IconX,
  MoreHorizontalIcon,
} from '~/components/icons/ui';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { CollectionEmptyState } from '~/components/ui/collection-empty-state';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { confirmDialogDismiss } from '~/components/ui/dialog-dismiss';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown';
import { PageTitle, SectionDescription } from '~/components/ui/forms';
import { Input } from '~/components/ui/input';

export function TemplatePage<T>(props: {
  title: string;
  description: string;
  itemName: string;
  emptyDescription: string;
  items: T[];
  getTitle: (item: T) => string | undefined;
  onAdd: () => void;
  onOpenGallery: () => void;
  children: (item: T) => JSX.Element;
}) {
  const [searchTerm, setSearchTerm] = createSignal('');
  const filteredItems = () =>
    props.items.filter(
      (item) =>
        props.getTitle(item)?.toLowerCase().includes(searchTerm().toLowerCase()) ?? false,
    );

  return (
    <div class="mx-auto flex h-full max-w-5xl flex-col gap-8 px-10 py-6">
      <div>
        <PageTitle>{props.title}</PageTitle>
        <SectionDescription>{props.description}</SectionDescription>
      </div>
      <div class="flex items-center justify-between gap-4">
        <div class="relative grow">
          <IconSearch class="absolute top-1/2 left-3 h-5 w-5 -translate-y-1/2 text-muted" />
          <Input
            type="text"
            placeholder="Search..."
            class="pl-10"
            value={searchTerm()}
            onInput={(e) => setSearchTerm(e.currentTarget.value)}
          />
        </div>
        <div class="flex gap-2">
          <Button variant="outline" onClick={props.onOpenGallery} class="whitespace-nowrap">
            <IconGallery class="h-5 w-5" />
            {props.itemName} Library
          </Button>
          <Button onClick={props.onAdd} class="whitespace-nowrap">
            <IconPlus class="h-5 w-5" />
            New {props.itemName}
          </Button>
        </div>
      </div>
      <div class="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
        <For
          each={filteredItems()}
          fallback={
            <CollectionEmptyState
              name={props.title.toLowerCase()}
              description={props.emptyDescription}
              searchTerm={searchTerm()}
              onClearSearch={() => setSearchTerm('')}
            />
          }
        >
          {(item) => props.children(item)}
        </For>
      </div>
    </div>
  );
}

export function TemplateCard(props: {
  title: JSX.Element;
  onEdit: () => void;
  onDelete: () => void;
  children: JSX.Element;
}) {
  const [open, setOpen] = createSignal(false);

  return (
    <Card variant="solid" onClick={props.onEdit}>
      <CardHeader class="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="flex items-center gap-2 text-lg font-semibold">
          {props.title}
        </CardTitle>
        <DropdownMenu open={open()} onOpenChange={setOpen}>
          <DropdownMenuTrigger
            as={Button}
            class="flex size-6 items-center justify-center rounded-md p-0 text-muted hover:bg-surface-hover hover:text-main"
            data-open={open()}
            variant="ghost"
            size="icon"
            onClick={(e: MouseEvent) => e.stopPropagation()}
          >
            <MoreHorizontalIcon class="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-36">
            <DropdownMenuGroup>
              <DropdownMenuItem
                onClick={(e: MouseEvent) => e.stopPropagation()}
                onSelect={props.onDelete}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent class="flex-1">{props.children}</CardContent>
    </Card>
  );
}

export function TemplateDeleteDialog(props: {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
  descriptionClass?: string;
  children: JSX.Element;
}) {
  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        <DialogDescription class={props.descriptionClass}>{props.children}</DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={() => props.onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={props.onConfirm}>
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TemplateGalleryDialog(props: {
  title: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  description?: string;
  children: JSX.Element;
}) {
  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <DialogContent class="max-w-5xl">
        <DialogHeader class="flex flex-row items-center justify-between">
          <DialogTitle>{props.title}</DialogTitle>
          <Button
            variant="toolbar"
            class="size-10 rounded-full p-0"
            onClick={() => props.onOpenChange(false)}
          >
            <IconX class="h-4 w-4" />
            <span class="sr-only">Close</span>
          </Button>
        </DialogHeader>
        <Show when={props.description}>{(description) => <p>{description()}</p>}</Show>
        <div class="grid grid-cols-3 gap-4 py-4">{props.children}</div>
      </DialogContent>
    </Dialog>
  );
}

export function TemplateGalleryCard(props: {
  title: JSX.Element;
  contentClass?: string;
  isAdded: boolean;
  validationError: string | undefined;
  onAdd: () => void;
  children: JSX.Element;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle class="flex items-center justify-between gap-2">{props.title}</CardTitle>
      </CardHeader>
      <CardContent class={props.contentClass}>
        {props.children}
        <div class="mt-4 flex justify-end">
          <Button
            variant="outline"
            size="sm"
            disabled={props.isAdded || !!props.validationError}
            title={props.validationError}
            onClick={props.onAdd}
          >
            {props.isAdded ? (
              <div class="flex items-center gap-1">
                <div class="text-sm">Added</div>
                <IconCheck class="size-4 text-success" />
              </div>
            ) : (
              'Add'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function TemplateDetailsDialog<T extends object>(props: {
  title: string;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedItem: T | null;
  children: (item: T, onDirtyChange: (isDirty: boolean) => void) => JSX.Element;
}) {
  const [isDirty, setIsDirty] = createSignal(false);

  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <DialogContent
        class="max-w-3xl"
        onEscapeKeyDown={(event) => confirmDialogDismiss(event, isDirty())}
        onPointerDownOutside={(event) => confirmDialogDismiss(event, isDirty())}
      >
        <Show when={props.selectedItem}>
          {(item) => (
            <>
              <DialogHeader>
                <DialogTitle>{props.title}</DialogTitle>
              </DialogHeader>
              {props.children(item(), setIsDirty)}
            </>
          )}
        </Show>
      </DialogContent>
    </Dialog>
  );
}

export function TemplateValidationError(props: { error: string | undefined }) {
  return (
    <Show when={props.error}>
      {(error) => (
        <p role="alert" class="mt-2 text-sm text-danger">
          {error()}
        </p>
      )}
    </Show>
  );
}

export function TemplateDetailsFooter(props: {
  class?: string;
  onClose: () => void;
  onSave: () => void;
  disabled: boolean;
  describedBy?: string;
}) {
  return (
    <DialogFooter class={props.class}>
      <Button variant="outline" onClick={props.onClose}>
        Cancel
      </Button>
      <Button
        onClick={props.onSave}
        disabled={props.disabled}
        aria-describedby={props.describedBy}
      >
        Save
      </Button>
    </DialogFooter>
  );
}
