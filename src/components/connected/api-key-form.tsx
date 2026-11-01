import { createSignal, Match, Show, Switch } from 'solid-js';

import { Input } from '~/components/ui';
import { Button } from '~/components/ui/button';
import { showSuccess } from '~/components/ui/notify';
import { checkApiKey, detectKeyKind } from '~/services/api-keys';
import { apiKeys, setApiKey } from '~/store/keys';
import { cn } from '~/util';

import { IconCircleCheck } from '../icons/ui';

/**
 * The OpenRouter key field. It checks the key with OpenRouter before saving it, and turns away
 * OpenAI keys, which Laneway no longer uses.
 */
export function ApiKeyForm(props: {
  onSaved: () => void;
  submitLabel?: string;
  class?: string;
}) {
  const [value, setValue] = createSignal('');
  const [status, setStatus] = createSignal<'idle' | 'checking' | 'invalid'>('idle');
  const kind = () => detectKeyKind(value());
  const canSave = () => kind() === 'openrouter' && status() !== 'checking';

  async function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (!canSave()) return;

    setStatus('checking');
    const result = await checkApiKey(value());
    if (result === 'invalid') {
      setStatus('invalid');
      return;
    }

    setApiKey(value());
    setStatus('idle');
    showSuccess('OpenRouter key saved.');
    props.onSaved();
  }

  return (
    <form class={cn('flex flex-col gap-2', props.class)} onSubmit={handleSubmit}>
      <label for="api-key-input" class="text-sm font-medium">
        OpenRouter API key
      </label>
      <div class="flex gap-2">
        <Input
          id="api-key-input"
          data-1p-ignore // disable 1Password extension
          autocomplete="off"
          type="password"
          placeholder="sk-or-…"
          aria-describedby="api-key-hint"
          aria-invalid={
            status() === 'invalid' || (value().trim() !== '' && !kind()) || kind() === 'openai'
          }
          class="min-w-0 flex-1"
          value={value()}
          onInput={(event) => {
            setValue(event.currentTarget.value);
            setStatus('idle');
          }}
        />
        <Button type="submit" disabled={!canSave()}>
          {status() === 'checking' ? 'Checking…' : (props.submitLabel ?? 'Save key')}
        </Button>
      </div>
      <p id="api-key-hint" class="text-sm text-muted" aria-live="polite">
        <Switch
          fallback={
            <>
              <Show when={apiKeys.openaiKeyRemoved}>
                Laneway now reaches every model, OpenAI's included, through OpenRouter, so your
                old OpenAI key was removed.{' '}
              </Show>
              One OpenRouter key works with every model here. Get one from{' '}
              <a
                class="text-main underline underline-offset-4"
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
              >
                OpenRouter
              </a>
              .
            </>
          }
        >
          <Match when={status() === 'invalid'}>
            <span role="alert" class="text-danger">
              OpenRouter rejected this key. Check it and try again.
            </span>
          </Match>
          <Match when={kind() === 'openai'}>
            This is an OpenAI key. Laneway now uses OpenRouter, which also runs OpenAI's models.
          </Match>
          <Match when={value().trim() !== '' && !kind()}>
            This does not look like an OpenRouter key. They start with sk-or-.
          </Match>
          <Match when={kind() === 'openrouter'}>
            <span class="inline-flex items-center gap-1.5">
              <IconCircleCheck class="size-4 text-success" />
              OpenRouter key. Works with every model.
            </span>
          </Match>
        </Switch>
      </p>
    </form>
  );
}
