import { nanoid } from 'nanoid';
import { Component, For, Show } from 'solid-js';

import { MultiCombobox } from '~/components/connected/multi-combobox';
import { IconChevronDown, IconChevronUp, IconPlus, IconTrash } from '~/components/icons/ui';
import {
  Button,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SettingDescription,
  SettingHeader,
  SettingTitle,
} from '~/components/ui';
import { setStore, store } from '~/store';
import { models } from '~/store/models';
import { SpeedDialItem } from '~/types';

import { Section } from './shared';

export const SpeedDial: Component = () => {
  const addSpeedDialItem = () => {
    if (store.speedDial.length >= 6) return; // Prevent adding more than 6 items
    const defaultItem = models.at(0);
    const newItem: SpeedDialItem = {
      id: nanoid(),
      type: 'model',
      referenceId: defaultItem?.id ?? '',
      title: defaultItem?.creator.name ?? '',
      sessionType: 'chat', // Default session type
    };
    setStore('speedDial', (items) => [...items, newItem]);
  };

  const removeSpeedDialItem = (id: string) => {
    setStore('speedDial', (items) => items.filter((item) => item.id !== id));
  };

  const updateSpeedDialItem = (
    id: string,
    field: keyof SpeedDialItem,
    value: string | undefined,
  ) => {
    setStore('speedDial', (item) => item.id === id, field, value);
  };

  const clearSpeedDialItem = (id: string) => {
    setStore('speedDial', (item) => item.id === id, { id: id });
  };

  const moveSpeedDialItem = (id: string, direction: 'up' | 'down') => {
    setStore('speedDial', (items) => {
      const index = items.findIndex((item) => item.id === id);
      if (index === -1) return items;
      const newIndex = direction === 'up' ? index - 1 : index + 1;
      if (newIndex < 0 || newIndex >= items.length) return items;
      const newItems = [...items];
      [newItems[index], newItems[newIndex]] = [newItems[newIndex], newItems[index]];
      return newItems;
    });
  };

  const sessionTypes: Record<string, string> = {
    note: 'Note',
    chat: 'Chat',
  };

  return (
    <Section title="Speed Dial" description="Manage your speed dial shortcuts (max 6 items).">
      <SettingHeader>
        <SettingTitle>Speed Dial Options</SettingTitle>
        <SettingDescription>
          Configure shortcuts for quick access to models, assistants, or presets.
        </SettingDescription>
      </SettingHeader>
      <div class="flex flex-col gap-4">
        <Show
          when={store.speedDial.length > 0}
          fallback={
            <div class="text-center text-gray-500">No speed dial items configured.</div>
          }
        >
          <For each={store.speedDial}>
            {(item, index) => (
              <div class="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-4">
                <Select
                  value={item.sessionType}
                  onChange={(value) => {
                    if (!value) return;
                    clearSpeedDialItem(item.id);
                    updateSpeedDialItem(item.id, 'sessionType', value);
                    updateSpeedDialItem(item.id, 'referenceId', undefined);
                    updateSpeedDialItem(item.id, 'title', '');
                    updateSpeedDialItem(item.id, 'type', undefined);
                  }}
                  options={['note', 'chat']}
                  itemComponent={(props) => (
                    <SelectItem item={props.item}>
                      {sessionTypes[props.item.rawValue]}
                    </SelectItem>
                  )}
                >
                  <SelectTrigger class="w-[80px]">
                    <SelectValue<string>>
                      {(state) => sessionTypes[state.selectedOption()]}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent />
                </Select>
                <MultiCombobox
                  includeAssistants
                  includeModels
                  includePresets={item.sessionType !== 'note'}
                  value={{ id: item.referenceId, type: item.type ?? 'model' }}
                  onSelect={(selection) => {
                    updateSpeedDialItem(item.id, 'referenceId', selection.referenceId);
                    updateSpeedDialItem(item.id, 'type', selection.type);
                  }}
                />
                <Input
                  value={item.title}
                  onInput={(e) => updateSpeedDialItem(item.id, 'title', e.currentTarget.value)}
                  placeholder="title"
                />
                <div class="flex gap-2">
                  <Button
                    variant="bare"
                    onClick={() => moveSpeedDialItem(item.id, 'up')}
                    size="icon"
                    disabled={index() === 0}
                  >
                    <IconChevronUp class="size-4" />
                  </Button>
                  <Button
                    variant="bare"
                    onClick={() => moveSpeedDialItem(item.id, 'down')}
                    size="icon"
                    disabled={index() === store.speedDial.length - 1}
                  >
                    <IconChevronDown class="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => removeSpeedDialItem(item.id)}
                    size="icon"
                    class="hover:bg-destructive"
                  >
                    <IconTrash class="size-4" />
                  </Button>
                </div>
              </div>
            )}
          </For>
        </Show>
        <div class="flex justify-start">
          <Button
            onClick={addSpeedDialItem}
            size="sm"
            variant="ghost"
            disabled={store.speedDial.length >= 6}
          >
            <IconPlus class="mr-2 h-5 w-5" />
            Add New
          </Button>
        </div>
      </div>
    </Section>
  );
};
