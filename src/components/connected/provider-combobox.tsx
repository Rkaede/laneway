import { type Component, createSignal, For, Show } from 'solid-js';

import { IconCheck, IconChevronsUpDown } from '~/components/icons/ui';
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
import { models, providers } from '~/store/models';
import type { ProviderId } from '~/types';
import { cn } from '~/util';

type ProviderComboboxProps = {
  value?: ProviderId;
  modelId?: string;
  onSelect: (providerId: ProviderId) => void;
};

export const ProviderCombobox: Component<ProviderComboboxProps> = (props) => {
  const [open, setOpen] = createSignal(false);

  const selectedProvider = () => (props.value ? providers[props.value] : undefined);

  const availableProviders = () => {
    if (!props.modelId) return [];
    const model = models.find((m) => m.id === props.modelId);
    return model ? model.provider : [];
  };

  return (
    <Popover open={open()} onOpenChange={setOpen}>
      <Button
        as={PopoverTrigger}
        variant="outline"
        class="w-full items-center justify-between text-left hover:bg-input"
      >
        <span class="flex-1">
          <Show when={selectedProvider()} fallback={'Select a provider...'}>
            {(provider) => (
              <span class="flex items-baseline gap-1">
                <span>{provider()}</span>
              </span>
            )}
          </Show>
        </span>
        <IconChevronsUpDown class="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      <PopoverContent class="p-0" style={{ width: 'var(--kb-popper-anchor-width)' }}>
        <Command>
          <CommandInput placeholder="Search providers..." />
          <CommandEmpty>No providers found.</CommandEmpty>
          <CommandList>
            <CommandGroup>
              <For each={availableProviders()}>
                {(provider) => (
                  <CommandItem
                    value={provider.id}
                    onSelect={(currentValue) => {
                      props.onSelect(currentValue as ProviderId);
                      setOpen(false);
                    }}
                  >
                    <span class="">{providers[provider.id]}</span>
                    <IconCheck
                      class={cn(
                        'ml-2 h-4 w-4 text-green-500',
                        props.value === provider.id ? 'opacity-100' : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                )}
              </For>
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
