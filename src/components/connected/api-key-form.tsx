import { createSignal, Match, Switch } from 'solid-js';

import { Input } from '~/components/ui';
import { Button } from '~/components/ui/button';
import { showSuccess } from '~/components/ui/notify';
import { checkApiKey, detectKeyProvider, KEY_PROVIDER_NAMES } from '~/services/api-keys';
import { setApiKey } from '~/store/keys';
import { cn } from '~/util';

import { IconCircleCheck } from '../icons/ui';

const linkClass = 'text-main underline underline-offset-4';

/**
 * One field for either provider's key. It works out the provider from the key's prefix and
 * checks the key with the provider before saving it.
 */
export function ApiKeyForm(props: {
  onSaved: () => void;
  submitLabel?: string;
  class?: string;
}) {
  const [value, setValue] = createSignal('');
  const [status, setStatus] = createSignal<'idle' | 'checking' | 'invalid'>('idle');
  const provider = () => detectKeyProvider(value());

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    const _provider = provider();
    if (!_provider || status() === 'checking') return;

    setStatus('checking');
    const result = await checkApiKey(_provider, value());
    if (result === 'invalid') {
      setStatus('invalid');
      return;
    }

    setApiKey(_provider, value());
    setStatus('idle');
    showSuccess(`${KEY_PROVIDER_NAMES[_provider]} key saved.`);
    props.onSaved();
  }

  return (
    <form class={cn('flex flex-col gap-2', props.class)} onSubmit={handleSubmit}>
      <label for="api-key-input" class="text-sm font-medium">
        API key
      </label>
      <div class="flex gap-2">
        <Input
          id="api-key-input"
          data-1p-ignore // disable 1Password extension
          autocomplete="off"
          type="password"
          placeholder="sk-or-… or sk-…"
          aria-describedby="api-key-hint"
          aria-invalid={status() === 'invalid' || (value().trim() !== '' && !provider())}
          class="min-w-0 flex-1"
          value={value()}
          onInput={(event) => {
            setValue(event.currentTarget.value);
            setStatus('idle');
          }}
        />
        <Button type="submit" disabled={!provider() || status() === 'checking'}>
          {status() === 'checking' ? 'Checking…' : (props.submitLabel ?? 'Save key')}
        </Button>
      </div>
      <p id="api-key-hint" class="text-sm text-muted" aria-live="polite">
        <Switch
          fallback={
            <>
              OpenRouter works with every model here. An OpenAI key works with OpenAI models
              only. Get one from{' '}
              <a
                class={linkClass}
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
              >
                OpenRouter
              </a>{' '}
              or{' '}
              <a
                class={linkClass}
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
              >
                OpenAI
              </a>
              .
            </>
          }
        >
          <Match when={status() === 'invalid' && provider()}>
            {(name) => (
              <span role="alert" class="text-danger">
                {KEY_PROVIDER_NAMES[name()]} rejected this key. Check it and try again.
              </span>
            )}
          </Match>
          <Match when={value().trim() !== '' && !provider()}>
            This does not look like an OpenRouter (sk-or-…) or OpenAI (sk-…) key.
          </Match>
          <Match when={provider() === 'openrouter'}>
            <span class="inline-flex items-center gap-1.5">
              <IconCircleCheck class="size-4 text-success" />
              OpenRouter key. Works with every model.
            </span>
          </Match>
          <Match when={provider() === 'openai'}>
            <span class="inline-flex items-center gap-1.5">
              <IconCircleCheck class="size-4 text-success" />
              OpenAI key. Works with OpenAI models. Add OpenRouter in Settings for the rest.
            </span>
          </Match>
        </Switch>
      </p>
    </form>
  );
}
