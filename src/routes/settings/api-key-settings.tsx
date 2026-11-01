import { Input } from '~/components/ui';
import { apiKeys, setApiKey } from '~/store/keys';

import { Section, Setting } from './shared';

export function APIKeySetting() {
  return (
    <Section
      title="API Keys"
      description="Keys are stored locally in your browser and are used to connect to provider APIs."
      anchor="api-keys"
    >
      <Setting
        title="OpenRouter"
        description={
          <>
            <p class="mb-1">
              OpenRouter is a gateway to providers like OpenAI, Anthropic, and Google. Laneway
              reaches every model, and text to speech, through it.
            </p>
            <p>
              You can get a key from the{' '}
              <a
                class="text-main underline underline-offset-4"
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
              >
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
          onInput={(e) => setApiKey(e.currentTarget.value)}
        />
      </Setting>
    </Section>
  );
}
