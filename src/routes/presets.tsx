import { TextField } from '@kobalte/core/text-field';
import { dequal } from 'dequal/lite';
import { nanoid } from 'nanoid';
import { type Component, createSignal, For, Show } from 'solid-js';
import { createStore } from 'solid-js/store';

import { ModelIcon } from '~/components/connected/model-icon';
import { MultiCombobox } from '~/components/connected/multi-combobox';
import {
  IconCheck,
  IconGallery,
  IconPlus,
  IconSearch,
  IconX,
  MoreHorizontalIcon,
} from '~/components/icons/ui';
import { DeleteButton } from '~/components/ui';
import { Avatar } from '~/components/ui/avatar';
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
import {
  FormContainer,
  PageTitle,
  SectionDescription,
  SettingDescription,
  SettingTitle,
} from '~/components/ui/forms';
import { Input } from '~/components/ui/input';
import { TextArea } from '~/components/ui/textarea';
import { setStore, store } from '~/store';
import { addPreset, deletePreset } from '~/store/actions/presets';
import { presets as galleryPresets } from '~/store/library/presets';
import { models } from '~/store/models';
import type { PresetProps } from '~/types';
import { clone } from '~/util';

export const Presets: Component = () => {
  const [selectedPreset, setSelectedPreset] = createSignal<PresetProps | null>(null);
  const [isModalOpen, setIsModalOpen] = createSignal(false);
  const [searchTerm, setSearchTerm] = createSignal('');
  const [isNewPreset, setIsNewPreset] = createSignal(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = createSignal(false);
  const [presetToDelete, setPresetToDelete] = createSignal<PresetProps | null>(null);
  const [isGalleryOpen, setIsGalleryOpen] = createSignal(false);

  function handleDeletePreset(preset: PresetProps) {
    setPresetToDelete(preset);
    setIsDeleteConfirmOpen(true);
  }

  function confirmDeletePreset() {
    const preset = presetToDelete();
    if (preset) {
      deletePreset(preset.id);
      setSelectedPreset(null);
      setIsModalOpen(false);
      setIsDeleteConfirmOpen(false);
      setPresetToDelete(null);
    }
  }

  function handleAdd() {
    const newPreset: PresetProps = {
      id: nanoid(),
      presetTitle: 'New Preset',
      input: '',
      chats: [],
    };
    setSelectedPreset(newPreset);
    setIsNewPreset(true);
    setIsModalOpen(true);
  }

  function handleAddFromGallery(preset: PresetProps) {
    addPreset(preset);
    setIsGalleryOpen(false);
  }

  const filteredPresets = () => {
    return store.presets.filter(
      (preset) =>
        preset.presetTitle?.toLowerCase().includes(searchTerm().toLowerCase()) ?? false,
    );
  };

  return (
    <div class="mx-auto flex h-full max-w-5xl flex-col gap-8 py-6">
      <div>
        <PageTitle>Presets</PageTitle>
        <SectionDescription>
          Teams of AI helpers designed to work side-by-side.
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
            Preset Library
          </Button>
          <Button onClick={handleAdd} class="whitespace-nowrap">
            <IconPlus class="mr-2 h-5 w-5" />
            Add New
          </Button>
        </div>
      </div>

      <div class="grid auto-rows-fr grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
        <For each={filteredPresets()}>
          {(preset) => (
            <PresetCard
              preset={preset}
              onEdit={() => {
                setSelectedPreset(preset);
                setIsNewPreset(false);
                setIsModalOpen(true);
              }}
              onDelete={() => handleDeletePreset(preset)}
            />
          )}
        </For>
      </div>

      <PresetDetailsDialog
        isOpen={isModalOpen()}
        onOpenChange={setIsModalOpen}
        selectedPreset={selectedPreset()}
        isNewPreset={isNewPreset()}
        onDelete={(id) => handleDeletePreset({ id } as PresetProps)}
      />

      <DeleteConfirmDialog
        isOpen={isDeleteConfirmOpen()}
        onOpenChange={setIsDeleteConfirmOpen}
        onConfirm={confirmDeletePreset}
        preset={presetToDelete()}
      />

      <PresetGalleryDialog
        isOpen={isGalleryOpen()}
        onOpenChange={setIsGalleryOpen}
        onAddFromGallery={handleAddFromGallery}
      />
    </div>
  );
};

const PresetCard: Component<{
  preset: PresetProps;
  onEdit: () => void;
  onDelete: () => void;
}> = (props) => {
  const [open, setOpen] = createSignal(false);

  function handleCardClick() {
    props.onEdit();
  }

  return (
    <Card variant="solid" onClick={handleCardClick}>
      <CardHeader class="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle class="flex items-center gap-2 text-lg font-semibold">
          <div>{props.preset.presetTitle}</div>
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
        <div class="mb-2 flex flex-wrap gap-2">
          <For each={props.preset.chats}>
            {(chat) => {
              const assistant = store.assistants.find((a) => a.id === chat.assistantId);
              const model = assistant
                ? models.find((m) => m.id === assistant.modelId)
                : models.find((m) => m.id === chat.modelId);
              return (
                <Show when={model?.icon}>
                  <Avatar>
                    <ModelIcon modelId={model?.id} class="size-5" />
                  </Avatar>
                </Show>
              );
            }}
          </For>
        </div>
        <p class="mb-2 line-clamp-2 text-sm text-muted-foreground">
          {props.preset.presetDescription || 'No description'}
        </p>
      </CardContent>
    </Card>
  );
};

const PresetDetailsDialog: Component<{
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  selectedPreset: PresetProps | null;
  isNewPreset: boolean;
  onDelete: (id: string) => void;
}> = (props) => {
  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <DialogContent class="max-w-3xl">
        <Show when={props.selectedPreset}>
          {(preset) => (
            <>
              <DialogHeader>
                <DialogTitle>
                  {props.isNewPreset ? 'Add New Preset' : 'Edit Preset'}
                </DialogTitle>
              </DialogHeader>
              <DialogDescription>
                <PresetDetails
                  initialPreset={preset()}
                  onClose={() => props.onOpenChange(false)}
                  onDelete={props.onDelete}
                  isNewPreset={props.isNewPreset}
                />
              </DialogDescription>
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
  preset: PresetProps | null;
}> = (props) => {
  const associatedAssistants = () => {
    if (!props.preset) return [];
    return props.preset.chats
      .map((chat) => store.assistants.find((a) => a.id === chat.assistantId))
      .filter(Boolean);
  };

  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm Deletion</DialogTitle>
        </DialogHeader>
        <DialogDescription class="flex flex-col gap-4">
          <p>Are you sure you want to delete this preset? This action cannot be undone.</p>
          <div>
            <Show when={associatedAssistants().length > 0}>
              <p>This preset uses the following assistants, they will not be removed:</p>
              <ul class="list-inside list-disc">
                <For each={associatedAssistants()}>
                  {(assistant) => <li>{assistant?.title}</li>}
                </For>
              </ul>
            </Show>
          </div>
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

const PresetGalleryDialog: Component<{
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onAddFromGallery: (preset: PresetProps) => void;
}> = (props) => {
  return (
    <Dialog open={props.isOpen} onOpenChange={props.onOpenChange}>
      <DialogContent class="max-w-5xl">
        <DialogHeader class="flex flex-row items-center justify-between">
          <DialogTitle>Preset Library</DialogTitle>
          <Button variant="close" onClick={() => props.onOpenChange(false)}>
            <IconX class="h-4 w-4" />
            <span class="sr-only">Close</span>
          </Button>
        </DialogHeader>
        <p>Assistants used in presets will be added to the assistant list.</p>
        <div class="grid grid-cols-3 gap-4 py-4">
          <For each={galleryPresets}>
            {(preset) => {
              const isAdded = () => store.presets.some((p) => p.templateId === preset.id);
              return (
                <Card>
                  <CardHeader>
                    <CardTitle class="flex items-center justify-between gap-2">
                      <div>{preset.presetTitle}</div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent class="flex flex-col gap-2">
                    <div class="flex gap-1">
                      <For each={preset.chats}>
                        {(chat) => {
                          return (
                            <Show when={chat.modelId}>
                              <ModelIcon modelId={chat.modelId} class="h-4 w-4" />
                            </Show>
                          );
                        }}
                      </For>
                    </div>
                    <p class="text-sm text-muted-foreground">{preset.presetDescription}</p>

                    <div class="mt-4 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={isAdded()}
                        onClick={() => {
                          props.onAddFromGallery(preset);
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

const PresetDetails: Component<{
  initialPreset: PresetProps;
  onClose: () => void;
  onDelete: (id: string) => void;
  isNewPreset: boolean;
}> = (props) => {
  const [localPreset, setLocalPreset] = createStore<PresetProps>(clone(props.initialPreset));

  function handleSave() {
    if (props.isNewPreset) {
      addPreset(localPreset);
    } else {
      setStore('presets', (p) => p.id === props.initialPreset.id, localPreset);
    }
    props.onClose();
  }

  function hasChanges() {
    return !dequal(props.initialPreset, localPreset);
  }

  return (
    <>
      <FormContainer class="mx-auto max-w-5xl">
        <div class="mb-4">
          <SettingTitle>Name</SettingTitle>
          <TextField id="name">
            <Input
              value={localPreset.presetTitle}
              onInput={(e) => setLocalPreset('presetTitle', e.target.value)}
            />
          </TextField>
        </div>
        <div class="mb-4">
          <SettingTitle>Description</SettingTitle>
          <SettingDescription>Provide a brief description of this preset.</SettingDescription>
          <TextField>
            <TextArea
              class="resize-none"
              placeholder="Enter a description for this preset..."
              rows="3"
              value={localPreset.presetDescription || ''}
              onInput={(e) => setLocalPreset('presetDescription', e.currentTarget.value)}
            />
          </TextField>
        </div>
        <div class="mb-4">
          <SettingTitle>Input</SettingTitle>
          <SettingDescription>
            When creating a new session, prefill the input field.
          </SettingDescription>
          <TextField>
            <TextArea
              class="resize-none"
              placeholder=""
              rows="6"
              value={localPreset.input}
              onInput={(e) => setLocalPreset('input', e.currentTarget.value)}
            />
          </TextField>
          <div class="mt-1 text-xs text-muted-foreground">
            Example: <i>Improve the write of the following. Give 5 options</i>
          </div>
        </div>
        <AssistantList
          presetId={props.initialPreset.id}
          localPreset={localPreset}
          setLocalPreset={setLocalPreset}
        />
      </FormContainer>
      <DialogFooter class="pt-6">
        <Button variant="outline" onClick={props.onClose}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={!hasChanges() || !localPreset.chats?.length}>
          Save
        </Button>
      </DialogFooter>
    </>
  );
};

const AssistantList: Component<{
  presetId: string;
  localPreset: PresetProps;
  setLocalPreset: (updater: (prev: PresetProps) => PresetProps) => void;
}> = (props) => {
  function handleSelect(id: string, type: 'assistant' | 'model' | 'preset') {
    // todo: refactor this, it could be cleaner
    if (type === 'assistant') {
      const selected = store.assistants.find((a) => a.id === id);
      if (selected) {
        props.setLocalPreset((prev) => ({
          ...prev,
          chats: [...(prev.chats || []), { assistantId: selected.id, messages: [] }],
        }));
      }
    }
    if (type === 'model') {
      const selected = models.find((m) => m.id === id);
      if (selected) {
        props.setLocalPreset((prev) => ({
          ...prev,
          chats: [...(prev.chats || []), { modelId: selected.id, messages: [] }],
        }));
      }
    }
  }

  function handleDelete(id?: string) {
    console.log(id);

    if (id) {
      props.setLocalPreset((prev) => ({
        ...prev,
        chats:
          prev.chats?.filter((chat) => chat.assistantId !== id && chat.modelId !== id) || [],
      }));
    }
  }

  return (
    <div class="gap-4">
      <SettingTitle>Assistants & Models</SettingTitle>
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <MultiCombobox
            class="max-w-72"
            onSelect={handleSelect}
            includeAssistants
            includeModels
            showType
          />
        </div>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-2">
          <Show when={props.localPreset.chats}>
            <For each={props.localPreset.chats}>
              {(chat) => (
                <Assistant
                  assistantId={chat.assistantId}
                  modelId={chat.modelId}
                  presetId={props.presetId}
                  onDelete={() => handleDelete(chat.assistantId || chat.modelId)}
                />
              )}
            </For>
          </Show>
        </div>
      </div>
    </div>
  );
};

const Assistant: Component<{
  assistantId?: string;
  modelId?: string;
  presetId: string;
  onDelete: () => void;
}> = (props) => {
  const assistant = () => store.assistants.find((a) => a.id === props.assistantId);
  const model = () =>
    assistant()
      ? models.find((m) => m.id === assistant()?.modelId)
      : models.find((m) => m.id === props.modelId);

  return (
    <div class="inline-flex items-center gap-2 rounded-lg border border-input py-1 pl-2 pr-2">
      <ModelIcon class="size-6" modelId={model()?.id} />
      <div class="flex-1">
        <div>{assistant()?.title ?? model()?.title ?? 'Unknown'}</div>
        <div class="text-xs text-muted-foreground">
          {(props.assistantId ? model()?.title : 'Model') ?? 'Unknown Model'}
        </div>
      </div>
      <DeleteButton onClick={props.onDelete} />
    </div>
  );
};
