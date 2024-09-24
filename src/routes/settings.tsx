import { nanoid } from 'nanoid';
import type { Component, JSX, ParentComponent } from 'solid-js';
import { For, Show } from 'solid-js';

import { MultiCombobox } from '~/components/connected/multi-combobox';
import { IconChevronDown, IconChevronUp, IconPlus, IconTrash } from '~/components/icons/ui';
import { Card, CardContent, Tag } from '~/components/ui';
import { Button } from '~/components/ui/button';
import {
  PageTitle,
  SectionDescription,
  SectionTitle,
  SettingDescription,
  SettingHeader,
  SettingTitle,
} from '~/components/ui/forms';
import { Input } from '~/components/ui/input';
import { Select, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Switch, SwitchControl, SwitchThumb } from '~/components/ui/switch';
import { deleteData, setStore, store } from '~/store';
import { apiKeys, deleteKeys, setApiKeys } from '~/store/keys';
import { models } from '~/store/models';
import { SpeedDialItem } from '~/types';
import { download } from '~/util';

export function Settings() {
  return (
    <div class="h-full overflow-auto py-6">
      <div class="container mx-auto grid max-w-screen-md gap-16 pb-24">
        <div>
          <PageTitle>Settings</PageTitle>
          <SectionDescription>
            Configure API keys, preferences, and data management options
          </SectionDescription>
          <hr class="mt-4" />
        </div>
        <General />
        <Completions />
        <APIKeys />
        <SpeedDial />
        <Data />
      </div>
    </div>
  );
}

function General() {
  return (
    <Section title="General" description="General settings for the app.">
      <Setting
        inline
        title="Generate Titles"
        description="On the first message, automatically generate a title. This requires an OpenAI API key to be set below. The GPT-3.5 Turbo model is used."
      >
        <SettingControl>
          <Switch
            checked={store.settings.generateTitles}
            onChange={(value) => setStore('settings', 'generateTitles', value)}
          >
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
          </Switch>
        </SettingControl>
      </Setting>
      <Setting
        title="System Model"
        description="This model is used by the app to generate title for new sessions."
      >
        <MultiCombobox
          value={{ id: store.settings.systemModel, type: 'model' }}
          onSelect={(modelId) => setStore('settings', 'systemModel', modelId)}
          class="w-1/2"
          includeModels
        />
      </Setting>
      <Setting title="Default Session" description="The default session for new conversations.">
        <MultiCombobox
          value={{
            id: store.settings.defaultSession.id,
            type: store.settings.defaultSession.type,
          }}
          onSelect={(id, type) => setStore('settings', 'defaultSession', { id, type })}
          class="w-1/2"
          includeAssistants
          includeModels
          includePresets
          showType
        />
      </Setting>
    </Section>
  );
}

export const SpeedDial: Component = () => {
  const addSpeedDialItem = () => {
    if (store.speedDial.length >= 6) return; // Prevent adding more than 6 items
    const defaultItem = models.at(0);
    const newItem: SpeedDialItem = {
      id: nanoid(),
      type: 'model',
      referenceId: defaultItem?.id ?? '',
      title: defaultItem?.creator.name ?? '',
    };
    setStore('speedDial', (items) => [...items, newItem]);
  };

  const removeSpeedDialItem = (id: string) => {
    setStore('speedDial', (items) => items.filter((item) => item.id !== id));
  };

  const updateSpeedDialItem = (id: string, field: keyof SpeedDialItem, value: string) => {
    setStore('speedDial', (item) => item.id === id, field, value);
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
              <div class="grid grid-cols-[1fr_1fr_auto] items-center gap-4">
                {(item.type === 'model' ||
                  item.type === 'assistant' ||
                  item.type === 'preset') && (
                  <MultiCombobox
                    includeAssistants
                    includeModels
                    includePresets
                    value={{ id: item.referenceId, type: item.type }}
                    onSelect={(id, type) => {
                      updateSpeedDialItem(item.id, 'referenceId', id);
                      updateSpeedDialItem(item.id, 'type', type);
                    }}
                  />
                )}
                <Input
                  value={item.title}
                  onInput={(e) => updateSpeedDialItem(item.id, 'title', e.currentTarget.value)}
                  placeholder="Title"
                />

                <div>
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

function Completions() {
  return (
    <Section
      title={
        <>
          Completions <Tag variant="warning">Experimental</Tag>
        </>
      }
      description="Provides completion suggestions in the chat input field. This is an experimental feature. Please report any issues you encounter."
    >
      <Setting
        inline
        title="Enable Completions"
        description="Enable or disable completions in the chat input field."
      >
        <SettingControl>
          <Switch
            checked={store.settings.completions.enabled}
            onChange={(value) => setStore('settings', 'completions', 'enabled', value)}
          >
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
          </Switch>
        </SettingControl>
      </Setting>
      <Setting
        title="Completion Model"
        description="This model is used to generate completions in the chat input field."
      >
        <MultiCombobox
          value={{ id: store.settings.completions.model, type: 'model' }}
          onSelect={(modelId) => setStore('settings', 'completions', 'model', modelId)}
          class="w-1/2"
          includeModels
        />
      </Setting>
    </Section>
  );
}

interface OpenRouterOption {
  value: 'always' | 'fallback';
  label: string;
}

const openRouterOptions: OpenRouterOption[] = [
  { value: 'always', label: 'Always' },
  {
    value: 'fallback',
    label: 'When keys are not configured for primary providers (OpenAI, Google)',
  },
];

function APIKeys() {
  return (
    <Section
      title="API Keys"
      description="Keys are stored locally in your browser and are used to connect to the providers API."
    >
      <Setting
        title="OpenRouter"
        description={
          <>
            <p>
              Open router bridges AI providers like OpenAI, Anthropic, and Google. Required for
              Anthropic & Llama models.
            </p>
            <p>
              You can get a key from the{' '}
              <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">
                OpenRouter keys page
              </a>
              .
            </p>
          </>
        }
      >
        <Input
          data-1p-ignore // disable 1Password extension
          placeholder="sk-ant-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          type="password"
          value={apiKeys?.openrouter ?? ''}
          onChange={(e) => setApiKeys('openrouter', e.target.value)}
        />

        <div class="mt-6">
          <SettingHeader>
            <SettingDescription>When to use OpenRouter:</SettingDescription>
          </SettingHeader>
        </div>

        <Select
          options={openRouterOptions}
          optionValue="value"
          optionTextValue="label"
          value={openRouterOptions.find((o) => o.value === store.settings.openRouterUsage)}
          onChange={(value) => value && setStore('settings', 'openRouterUsage', value.value)}
          itemComponent={(props) => (
            <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>
          )}
        >
          <SelectTrigger>
            <SelectValue<OpenRouterOption>>
              {(state) => state.selectedOption().label ?? 'Select option'}
            </SelectValue>
          </SelectTrigger>
        </Select>
      </Setting>
      <Setting
        title="OpenAI"
        description={
          <>
            Used for the ChatGPT models. You can get a key from the{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
            >
              OpenAI dashboard
            </a>
            .
          </>
        }
      >
        <Input
          data-1p-ignore // disable 1Password extension
          placeholder="sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          type="password"
          value={apiKeys?.openai ?? ''}
          onChange={(e) => setApiKeys('openai', e.target.value)}
        />
      </Setting>

      <Setting
        title="Google"
        description={
          <>
            Used for the Gemini models. You can get a key from the{' '}
            <a
              href="https://aistudio.google.com/app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google AI Studio
            </a>
            .
          </>
        }
      >
        <Input
          data-1p-ignore // disable 1Password extension
          placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          type="password"
          value={apiKeys?.google ?? ''}
          onChange={(e) => setApiKeys('google', e.target.value)}
        />
      </Setting>
    </Section>
  );
}

function Data() {
  return (
    <Section title="Data" description="All data is stored locally in your browser.">
      <Setting
        inline
        title="Delete Data"
        description="Removes all data from your browser except for the API keys."
      >
        <div class="flex justify-end">
          <Button variant="destructive" onClick={() => deleteData()}>
            Delete Data
          </Button>
        </div>
      </Setting>
      <Setting
        inline
        title="Delete API Keys"
        description="Removes the API keys from your browser."
      >
        <div class="flex justify-end">
          <Button variant="destructive" onClick={() => deleteKeys()}>
            Delete Keys
          </Button>
        </div>
      </Setting>
      <Setting inline title="Export Data" description="Backup all your data to a file.">
        <div class="flex justify-end">
          <Button
            variant="default"
            onClick={() => download(JSON.stringify(store), 'chat-data.json')}
          >
            Export Data
          </Button>
        </div>
      </Setting>
    </Section>
  );
}

type SectionProps = {
  title?: JSX.Element;
  description?: JSX.Element;
};

const Section: ParentComponent<SectionProps> = (props) => {
  return (
    <div class="container mx-auto flex flex-col gap-1">
      <div class="pb-2 pl-2">
        <SectionTitle>{props.title}</SectionTitle>
        <SectionDescription>{props.description}</SectionDescription>
      </div>
      <SectionContent>{props.children}</SectionContent>
    </div>
  );
};

const SectionContent: ParentComponent = (props) => (
  <Card class="">
    <CardContent class="flex flex-col gap-8 pb-8 pt-6">{props.children}</CardContent>
  </Card>
);

const SettingControl: ParentComponent = (props) => {
  return <div class="flex justify-end">{props.children}</div>;
};

type SettingProps = {
  inline?: boolean;
  title?: string;
  description?: JSX.Element;
};

const Setting: ParentComponent<SettingProps> = (props) => {
  return (
    <div
      classList={{
        'grid grid-cols-[1fr_130px] items-center': props.inline,
        'flex flex-col gap-1': !props.inline,
      }}
    >
      <SettingHeader>
        <SettingTitle>{props.title}</SettingTitle>
        <SettingDescription>{props.description}</SettingDescription>
      </SettingHeader>
      {props.children}
    </div>
  );
};
