import { createUniqueId, type JSX, Match, Show, Switch } from 'solid-js';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { OPENROUTER_KEYS_URL } from '~/constants';
import type { KeyKind } from '~/services/api-keys';
import { cn } from '~/util';

import { IconCircleCheck } from '../icons/ui';

export type ApiKeyFormStatus = 'idle' | 'checking' | 'invalid';

/**
 * The OpenRouter key field, without any checking or saving. `hint` replaces the text under the
 * field while it has nothing to report, and `hideLabel` keeps the label for screen readers only.
 */
export function ApiKeyFormView(props: {
  value: string;
  keyKind?: KeyKind;
  status?: ApiKeyFormStatus;
  openaiKeyRemoved?: boolean;
  onInput: (value: string) => void;
  onSubmit: () => void;
  submitLabel?: string;
  hint?: JSX.Element;
  hideLabel?: boolean;
  class?: string;
}) {
  const inputId = createUniqueId();
  const hintId = createUniqueId();
  const canSave = () => props.keyKind === 'openrouter' && props.status !== 'checking';
  const looksWrong = () => props.value.trim() !== '' && !props.keyKind;

  function handleSubmit(event: SubmitEvent) {
    event.preventDefault();
    if (canSave()) props.onSubmit();
  }

  return (
    <form class={cn('flex flex-col gap-2', props.class)} onSubmit={handleSubmit}>
      <label for={inputId} class={cn('text-sm font-medium', props.hideLabel && 'sr-only')}>
        OpenRouter API key
      </label>
      <div class="flex gap-2">
        <Input
          id={inputId}
          passwordManager
          autocomplete="off"
          type="password"
          placeholder="sk-or-…"
          aria-describedby={hintId}
          aria-invalid={
            props.status === 'invalid' || looksWrong() || props.keyKind === 'openai'
          }
          class="min-w-0 flex-1"
          value={props.value}
          onInput={(event) => props.onInput(event.currentTarget.value)}
        />
        <Button type="submit" disabled={!canSave()}>
          {props.status === 'checking' ? 'Checking…' : (props.submitLabel ?? 'Save key')}
        </Button>
      </div>
      <p id={hintId} class="text-sm text-muted" aria-live="polite">
        <Switch
          fallback={
            <>
              <Show when={props.openaiKeyRemoved}>
                Laneway now reaches every model, OpenAI's included, through OpenRouter, so your
                old OpenAI key was removed.{' '}
              </Show>
              {props.hint ?? (
                <>
                  One OpenRouter key works with every model here. Get one from{' '}
                  <a
                    class="text-main underline underline-offset-4"
                    href={OPENROUTER_KEYS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    OpenRouter
                  </a>
                  .
                </>
              )}
            </>
          }
        >
          <Match when={props.status === 'invalid'}>
            <span role="alert" class="text-danger">
              OpenRouter rejected this key. Check it and try again.
            </span>
          </Match>
          <Match when={props.keyKind === 'openai'}>
            This is an OpenAI key. Laneway now uses OpenRouter, which also runs OpenAI's models.
          </Match>
          <Match when={looksWrong()}>
            This does not look like an OpenRouter key. They start with sk-or-.
          </Match>
          <Match when={props.keyKind === 'openrouter'}>
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
