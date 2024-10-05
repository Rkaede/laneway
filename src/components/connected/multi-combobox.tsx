import { type Component, createSignal, For, Show } from 'solid-js';

import { IconCheck, IconChevronsUpDown, IconLayoutGrid } from '~/components/icons/ui';
import {
  Button,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '~/components/ui';
import { store } from '~/store';
import { models, modelsByCreator } from '~/store/models';
import { cn } from '~/util';

import { ModelIcon } from './model-icon';

type MultiComboboxProps = {
  value?: { id?: string; type: 'assistant' | 'model' | 'preset' };
  onSelect: (selection: {
    referenceId: string;
    type: 'assistant' | 'model' | 'preset';
  }) => void;
  class?: string;
  includeModels?: boolean;
  includeAssistants?: boolean;
  includePresets?: boolean;
  showType?: boolean;
};

export const MultiCombobox: Component<MultiComboboxProps> = (props) => {
  const [open, setOpen] = createSignal(false);

  const selectedItem = () => {
    if (props.includeAssistants && props.value?.type === 'assistant') {
      const assistant = store.assistants.find((a) => a.id === props.value?.id);
      if (assistant) return { ...assistant, type: 'assistant' as const };
    }
    if (props.includeModels && props.value?.type === 'model') {
      const model = models.find((m) => m.id === props.value?.id);
      if (model) return { ...model, type: 'model' as const };
    }
    if (props.includePresets && props.value?.type === 'preset') {
      const preset = store.presets.find((p) => p.id === props.value?.id);
      if (preset) return { ...preset, type: 'preset' as const, title: preset.presetTitle };
    }
    return undefined;
  };

  const modelId = () => {
    const item = selectedItem();
    return item ? (item.type === 'assistant' ? item.modelId : item.id) : undefined;
  };

  return (
    <Popover open={open()} onOpenChange={setOpen}>
      <Button
        as={PopoverTrigger}
        variant="outline"
        class={cn(
          'w-full items-center justify-between bg-transparent text-left hover:bg-transparent',
          props.class,
        )}
      >
        <Show
          when={selectedItem()?.type === 'preset'}
          fallback={<ModelIcon modelId={modelId()} class="mr-2 size-4" />}
        >
          <IconLayoutGrid class="mr-2 size-4" />
        </Show>
        <span class="flex-1">
          {props.value ? (
            <span class="flex items-baseline gap-1">
              <span>{selectedItem()?.title}</span>
              {props.showType && (
                <span class="text-xs text-muted-foreground">({selectedItem()?.type})</span>
              )}
            </span>
          ) : (
            'Select item...'
          )}
        </span>
        <IconChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      <PopoverContent class="p-0" style={{ width: 'var(--kb-popper-anchor-width)' }}>
        <Command
          filter={(_, search, keywords = []) => {
            const extendValue = keywords.join(' ').toLowerCase();
            if (extendValue.includes(search.toLowerCase())) return 1;
            return 0;
          }}
        >
          <CommandInput placeholder="Search items..." />
          <CommandEmpty>No item found.</CommandEmpty>
          <CommandList>
            <Show when={props.includeAssistants}>
              <CommandGroup heading="Assistants">
                <For each={store.assistants}>
                  {(assistant) => (
                    <CommandItem
                      value={assistant.id}
                      keywords={[assistant.title]}
                      onSelect={(currentValue) => {
                        props.onSelect({ referenceId: currentValue, type: 'assistant' });
                        setOpen(false);
                      }}
                    >
                      <ModelIcon modelId={assistant.modelId} class="mr-2 size-4" />
                      <span>{assistant.title}</span>
                      <IconCheck
                        class={cn(
                          'ml-2 h-4 w-4 text-green-500',
                          props.value?.id === assistant.id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                    </CommandItem>
                  )}
                </For>
              </CommandGroup>
            </Show>
            <Show when={props.includeModels}>
              <For each={modelsByCreator()}>
                {(group) => (
                  <CommandGroup
                    heading={
                      props.includeAssistants || props.includePresets
                        ? `${group.title} Models`
                        : group.title
                    }
                  >
                    <For each={group.models}>
                      {(model) => (
                        <CommandItem
                          value={model.id}
                          keywords={[model.title]}
                          onSelect={(currentValue) => {
                            props.onSelect({ referenceId: currentValue, type: 'model' });
                            setOpen(false);
                          }}
                        >
                          <ModelIcon modelId={model.id} class="mr-2 size-4" />
                          <span>{model.title}</span>
                          <IconCheck
                            class={cn(
                              'ml-2 h-4 w-4 text-green-500',
                              props.value?.id === model.id ? 'opacity-100' : 'opacity-0',
                            )}
                          />
                        </CommandItem>
                      )}
                    </For>
                  </CommandGroup>
                )}
              </For>
            </Show>
            <Show when={props.includePresets}>
              <CommandGroup heading="Presets">
                <For each={store.presets}>
                  {(preset) => (
                    <CommandItem
                      value={preset.id}
                      keywords={preset.presetTitle ? [preset.presetTitle] : []}
                      onSelect={(currentValue) => {
                        props.onSelect({ referenceId: currentValue, type: 'preset' });
                        setOpen(false);
                      }}
                    >
                      <IconLayoutGrid class="mr-2 size-4" />
                      <span>{preset.presetTitle}</span>
                      <IconCheck
                        class={cn(
                          'ml-2 h-4 w-4 text-green-500',
                          props.value?.id === preset.id ? 'opacity-100' : 'opacity-0',
                        )}
                      />
                    </CommandItem>
                  )}
                </For>
              </CommandGroup>
            </Show>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
