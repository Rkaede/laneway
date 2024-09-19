import type { ParentComponent } from 'solid-js';

import { MultiCombobox } from '~/components/connected/multi-combobox';
import { Card, CardContent } from '~/components/ui';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';
import { Switch, SwitchControl, SwitchThumb } from '~/components/ui/switch';
import { deleteData, setStore, store } from '~/store';
import { deleteKeys } from '~/store/keys';
import { apiKeys, setApiKeys } from '~/store/keys';
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
        <APIKeys />
        <Data />
      </div>
    </div>
  );
}

function General() {
  return (
    <Section>
      <SectionHeader>
        <SectionTitle>General</SectionTitle>
        <SectionDescription>General settings for the app.</SectionDescription>
      </SectionHeader>
      <SectionContent>
        <Setting inline>
          <SettingHeader>
            <SettingTitle>Generate Titles</SettingTitle>
            <SettingDescription>
              On the first message, automatically generate a title. This requires an OpenAI API
              key to be set below. The GPT-3.5 Turbo model is used.
            </SettingDescription>
          </SettingHeader>
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
        <Setting>
          <SettingHeader>
            <SettingTitle>System Model</SettingTitle>
            <SettingDescription>
              This model is used by the app to generate title for new sessions.
            </SettingDescription>
          </SettingHeader>
          <MultiCombobox
            value={{ id: store.settings.systemModel, type: 'model' }}
            onSelect={(modelId) => setStore('settings', 'systemModel', modelId)}
            class="w-1/2"
            includeModels
          />
        </Setting>
        <Setting>
          <SettingHeader>
            <SettingTitle>Default Session</SettingTitle>
            <SettingDescription>The default session for new conversations.</SettingDescription>
          </SettingHeader>
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
      </SectionContent>
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
    <Section>
      <SectionHeader>
        <SectionTitle>API Keys</SectionTitle>
        <SectionDescription>
          Keys are stored locally in your browser and are used to connect to the providers API.
        </SectionDescription>
      </SectionHeader>
      <SectionContent>
        <Setting>
          <SettingHeader>
            <SettingTitle>OpenRouter</SettingTitle>
            <SettingDescription class="flex flex-col gap-2">
              <p>
                Open router bridges AI providers like OpenAI, Anthropic, and Google. Required
                for Anthropic & Llama models.
              </p>
              <p>
                You can get a key from the{' '}
                <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">
                  OpenRouter keys page
                </a>
                .
              </p>
            </SettingDescription>
          </SettingHeader>
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
            <SelectContent />
          </Select>
        </Setting>
        <Setting>
          <SettingHeader>
            <SettingTitle>OpenAI</SettingTitle>
            <SettingDescription>
              Used for the ChatGPT models. You can get a key from the{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
              >
                OpenAI dashboard
              </a>
              .
            </SettingDescription>
          </SettingHeader>

          <Input
            data-1p-ignore // disable 1Password extension
            placeholder="sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            type="password"
            value={apiKeys?.openai ?? ''}
            onChange={(e) => setApiKeys('openai', e.target.value)}
          />
        </Setting>

        <Setting>
          <SettingHeader>
            <SettingTitle>Google</SettingTitle>
            <SettingDescription>
              Used for the Gemini models. You can get a key from the{' '}
              <a
                href="https://aistudio.google.com/app/"
                target="_blank"
                rel="noopener noreferrer"
              >
                Google AI Studio
              </a>
              .
            </SettingDescription>
          </SettingHeader>
          <Input
            data-1p-ignore // disable 1Password extension
            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            type="password"
            value={apiKeys?.google ?? ''}
            onChange={(e) => setApiKeys('google', e.target.value)}
          />
        </Setting>
      </SectionContent>
    </Section>
  );
}

function Data() {
  return (
    <Section>
      <SectionHeader>
        <SectionTitle>Data</SectionTitle>
        <SectionDescription>All data is stored locally in your browser.</SectionDescription>
      </SectionHeader>
      <SectionContent>
        <Setting inline>
          <SettingHeader>
            <SettingTitle>Delete Data</SettingTitle>
            <SettingDescription>
              Removes all data from your browser except for the API keys.
            </SettingDescription>
          </SettingHeader>
          <div class="flex justify-end">
            <Button variant="destructive" onClick={() => deleteData()}>
              Delete Data
            </Button>
          </div>
        </Setting>
        <Setting inline>
          <SettingHeader>
            <SettingTitle>Delete API Keys</SettingTitle>
            <SettingDescription>Removes the API keys from your browser.</SettingDescription>
          </SettingHeader>
          <div class="flex justify-end">
            <Button variant="destructive" onClick={() => deleteKeys()}>
              Delete Keys
            </Button>
          </div>
        </Setting>
        <Setting inline>
          <div class="flex flex-1 flex-col gap-2">
            <SettingTitle>Export Data</SettingTitle>
            <SettingDescription>Backup all your data to a file.</SettingDescription>
          </div>
          <div class="flex justify-end">
            <Button
              variant="default"
              onClick={() => download(JSON.stringify(store), 'chat-data.json')}
            >
              Export Data
            </Button>
          </div>
        </Setting>
      </SectionContent>
    </Section>
  );
}

const Section: ParentComponent = (props) => {
  return <div class="container mx-auto flex flex-col gap-1">{props.children}</div>;
};

const SectionContent: ParentComponent = (props) => (
  <Card class="py-6">
    <CardContent class="flex flex-col gap-8">{props.children}</CardContent>
  </Card>
);

const SettingControl: ParentComponent = (props) => {
  return <div class="flex justify-end">{props.children}</div>;
};

const SectionHeader: ParentComponent = (props) => {
  return <div class="pb-2 pl-6">{props.children}</div>;
};

const Setting: ParentComponent<{ inline?: boolean }> = (props) => {
  return (
    <div
      classList={{
        'grid grid-cols-[1fr_130px] items-center': props.inline,
        'flex flex-col gap-1': !props.inline,
      }}
    >
      {props.children}
    </div>
  );
};
