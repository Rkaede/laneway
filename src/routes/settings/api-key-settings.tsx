import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SettingDescription,
  SettingHeader,
} from '~/components/ui';
import { setStore, store } from '~/store';
import { apiKeys, setApiKeys } from '~/store/keys';

import { Section, Setting } from './shared';

interface OpenRouterOption {
  value: 'always' | 'fallback';
  label: string;
}

const openRouterOptions: OpenRouterOption[] = [
  { value: 'always', label: 'Always' },
  {
    value: 'fallback',
    label: 'When direct OpenAI access is not configured or supported',
  },
];

export function APIKeySetting() {
  return (
    <Section
      title="API Keys"
      description="Keys are stored locally in your browser and are used to connect to the providers API."
      anchor="api-keys"
    >
      <Setting
        title="OpenRouter"
        description={
          <>
            <p class="mb-1">
              OpenRouter is a gateway to multiple AI providers like OpenAI, Anthropic, and
              Google. Required for models without direct OpenAI support, including Gemini and
              GPT-5.x.
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
          autocomplete="off"
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
      <Setting
        title="OpenAI"
        description={
          <>
            Used for selected OpenAI models and TTS. GPT-5.x requires OpenRouter. You can get a
            key from the{' '}
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
          autocomplete="off"
          type="password"
          value={apiKeys?.openai ?? ''}
          onChange={(e) => setApiKeys('openai', e.target.value)}
        />
      </Setting>
    </Section>
  );
}
