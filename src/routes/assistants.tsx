import { dequal } from 'dequal/lite';
import { type Component, createSignal, For, Show } from 'solid-js';
import { createStore } from 'solid-js/store';

import { ChatSettings } from '~/components/connected/chat-settings';
import { ModelIcon } from '~/components/connected/model-icon';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown';
import { PageTitle, SectionDescription } from '~/components/ui/forms';
import { Input } from '~/components/ui/input';
import { setStore, store } from '~/store';
import { addAssistant, deleteAssistant } from '~/store/actions';
import { assistants as galleryAssistants } from '~/store/library/assistants';
import { models } from '~/store/models';
import type { AssistantProps } from '~/types';
import { clone } from '~/util';

export function Assistants() {
  const [selectedAssistant, setSelectedAssistant] = createSignal<AssistantProps | null>(null);
  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [searchTerm, setSearchTerm] = createSignal('');
  const [isNewAssistant, setIsNewAssistant] = createSignal(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = createSignal(false);
  const [assistantToDelete, setAssistantToDelete] = createSignal<string | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = createSignal(false);

  function handleAdd() {
    const newAssistant: AssistantProps = {
      id: '',
      title: 'New Assistant',
      subtitle: '',
      modelId: '',
      systemPrompt: '',
    };
    setSelectedAssistant(newAssistant);
    setIsNewAssistant(true);
    setIsModalOpen(true);
  }

  function handleDeleteAssistant(assistantId: string) {
    setAssistantToDelete(assistantId);
    setIsDeleteConfirmOpen(true);
  }

  function confirmDeleteAssistant() {
    const assistant = assistantToDelete();
    if (assistant) {
      deleteAssistant(assistant);
      setSelectedAssistant(null);
      setIsModalOpen(false);
      setIsDeleteConfirmOpen(false);
      setAssistantToDelete(null);
    }
  }

  const filteredAssistants = () => {
    return store.assistants.filter(
      (assistant) =>
        assistant.title?.toLowerCase().includes(searchTerm().toLowerCase()) ?? false,
    );
  };

  function handleAddFromGallery(assistant: AssistantProps) {
    addAssistant(assistant);
    setIsGalleryOpen(false);
  }

  return (
    <div class="mx-auto flex h-full max-w-5xl flex-col gap-8 py-6">
      <div>
        <PageTitle>Assistants</PageTitle>
        <SectionDescription>
          Assistants are AI models with predefined prompts and settings.
        </SectionDescription>
      </div>

      <div class="flex items-center justify-between gap-4">
        <div class="relative flex-grow">
          <IconSearch class="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            class="pl-10"
            value={searchTerm()}
            onInput={(e) => setSearchTerm(e.currentTarget.value)}
          />
        </div>
        <div class="flex gap-2">
          <Button onClick={() => setIsGalleryOpen(true)} class="whitespace-nowrap">
            <IconGallery class="mr-2 h-5 w-5" />
            Assistant Library
          </Button>
          <Button onClick={handleAdd} class="whitespace-nowrap">
            <IconPlus class="mr-2 h-5 w-5" />
            Create New
          </Button>
        </div>
      </div>

      <div class="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
        <For each={filteredAssistants()}>
          {(assistant) => (
            <AssistantCard
              assistant={assistant}
              onEdit={() => {
                setSelectedAssistant(assistant);
                setIsNewAssistant(false);
                setIsModalOpen(true);
              }}
              onDelete={() => handleDeleteAssistant(assistant.id)}
            />
          )}
        </For>
      </div>

      <AssistantDetailsDialog
        isOpen={isModalOpen()}
        onOpenChange={setIsModalOpen}
        selectedAssistant={selectedAssistant()}
        isNewAssistant={isNewAssistant()}
        onClose={() => setIsModalOpen(false)}
        onDelete={(id) => handleDeleteAssistant(id)}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteConfirmOpen()}
        onOpenChange={setIsDeleteConfirmOpen}
        onConfirm={confirmDeleteAssistant}
      />

      <AssistantGalleryDialog
        isOpen={isGalleryOpen()}
        onOpenChange={setIsGalleryOpen}
        onAddFromGallery={handleAddFromGallery}
      />
    </div>
  );
}

const AssistantDetailsDialog: Component<{
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedAssistant: AssistantProps | null;
  isNewAssistant: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
}> = (props) => {
  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <DialogContent class="max-w-3xl">
        <Show when={props.selectedAssistant}>
          {(assistant) => (
            <>
              <DialogHeader>
                <DialogTitle>
                  {props.isNewAssistant ? 'Add New Assistant' : 'Edit Assistant'}
                </DialogTitle>
              </DialogHeader>
              <AssistantDetails
                initialAssistant={assistant()}
                onClose={props.onClose}
                onDelete={() => props.onDelete(assistant().id)}
                isNewAssistant={props.isNewAssistant}
              />
            </>
          )}
        </Show>
      </DialogContent>
    </Dialog>
  );
};

const DeleteConfirmDialog: Component<{
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onConfirm: () => void;
}> = (props) => {
  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          Are you sure you want to delete this assistant? This action cannot be undone.
        </DialogDescription>
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
};

const AssistantGalleryDialog: Component<{
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddFromGallery: (assistant: AssistantProps) => void;
}> = (props) => {
  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <DialogContent class="max-w-5xl">
        <DialogHeader class="flex flex-row items-center justify-between">
          <DialogTitle>Assistant Library</DialogTitle>
          <Button variant="close" onClick={() => props.onOpenChange(false)}>
            <IconX class="h-4 w-4" />
            <span class="sr-only">Close</span>
          </Button>
        </DialogHeader>
        <div class="grid grid-cols-3 gap-4 py-4">
          <For each={galleryAssistants}>
            {(assistant) => {
              const isAdded = () => store.assistants.some((a) => a.templateId === assistant.id);
              return (
                <Card>
                  <CardHeader>
                    <CardTitle class="flex items-center justify-between gap-2">
                      <div class="flex items-center gap-2">
                        <ModelIcon modelId={assistant.modelId} class="h-5 w-5" />
                        {assistant.title}
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p class="text-sm text-muted-foreground">{assistant.subtitle}</p>
                    <div class="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isAdded()}
                        onClick={() => {
                          props.onAddFromGallery(assistant);
                        }}
                      >
                        {isAdded() ? (
                          <div class="flex items-center gap-1">
                            <div class="text-sm">Added</div>
                            <IconCheck class="size-4 text-green-500" />
                          </div>
                        ) : (
                          'Add'
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            }}
          </For>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const AssistantCard: Component<{
  assistant: AssistantProps;
  onEdit: () => void;
  onDelete: () => void;
}> = (props) => {
  const [open, setOpen] = createSignal(false);

  function handleCardClick() {
    props.onEdit();
  }

  const model = () => models.find((m) => m.id === props.assistant.modelId);

  return (
    <Card variant="solid" onClick={handleCardClick}>
      <CardHeader class="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="flex items-center gap-2 text-lg font-semibold">
          <div>{props.assistant.title ?? 'Untitled'}</div>
          <Show when={model()?.icon}>
            <ModelIcon modelId={model()?.id} class="mr-1 h-4 w-4" />
          </Show>
        </CardTitle>
        <DropdownMenu open={open()} onOpenChange={(o) => setOpen(o)}>
          <DropdownMenuTrigger
            as={Button}
            class="flex size-6 items-center justify-center rounded-md p-0 text-white hover:bg-background-4"
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
                onClick={(e: MouseEvent) => {
                  e.stopPropagation();
                  props.onDelete();
                }}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent class="flex-1">
        <p class="mb-2 line-clamp-2 text-sm text-muted-foreground">
          {props.assistant.subtitle || 'No description'}
        </p>
      </CardContent>
    </Card>
  );
};

function AssistantDetails(props: {
  initialAssistant: AssistantProps;
  onClose: () => void;
  onDelete: () => void;
  isNewAssistant: boolean;
}) {
  const [localAssistant, setLocalAssistant] = createStore<AssistantProps>(
    clone(props.initialAssistant),
  );

  function handleSave() {
    if (props.isNewAssistant) {
      addAssistant(localAssistant);
    } else {
      setStore('assistants', (a) => a.id === props.initialAssistant.id, localAssistant);
    }
    props.onClose();
  }

  function hasChanges() {
    return !dequal(props.initialAssistant, localAssistant);
  }

  return (
    <>
      <div class="p-4">
        <ChatSettings
          name={localAssistant.title}
          subtitle={localAssistant.subtitle}
          modelId={localAssistant.modelId}
          systemPrompt={localAssistant.systemPrompt || ''}
          onNameChange={(value) => setLocalAssistant('title', value)}
          onProviderChange={(value) => setLocalAssistant('providerId', value)}
          onModelChange={(value) => setLocalAssistant('modelId', value)}
          onSubtitleChange={(value) => setLocalAssistant('subtitle', value)}
          onSystemPromptChange={(value) => setLocalAssistant('systemPrompt', value)}
        />
      </div>
      <DialogFooter class="pt-6">
        <Button variant="outline" onClick={props.onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges()}>
          Save
        </Button>
      </DialogFooter>
    </>
  );
}
