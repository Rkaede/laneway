import { type Component, For, type JSX, onMount, Show } from 'solid-js';

import { Button } from '~/components/ui/button';
import { OPENROUTER_KEYS_URL } from '~/constants';
import { useActionContext } from '~/hooks/use-action-context';
import { setStore } from '~/store';
import { actions } from '~/store/actions';
import { story } from '~/store/examples';
import { anyKeysSet } from '~/store/selectors';

import { IconCircleCheck, IconExternalLink, IconGithub } from '../icons/ui';
import { ApiKeyForm } from './api-key-form';

const EXAMPLE_SESSION_ID = story().session.id;

const POINTS = ['Free and open source', 'Chats stay in your browser'];

function Step(props: { number: number; title: string; children: JSX.Element }) {
  return (
    <li class="flex items-start gap-3">
      <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-xs font-semibold text-brand-subtle-fg tabular-nums">
        {props.number}
      </span>
      <div class="flex min-w-0 flex-1 flex-col gap-2">
        <div class="font-semibold">{props.title}</div>
        {props.children}
      </div>
    </li>
  );
}

/**
 * The first-run page. The root route sends new visitors here once, before they have a key, and
 * it then stays out of the way: New Chat always opens a chat. Until a key is saved it offers no
 * way to start a chat, so nobody expects to chat without one.
 */
export const WelcomeContent: Component = () => {
  const context = useActionContext();

  onMount(() => setStore('settings', 'hasSeenWelcome', true));

  function startChat() {
    actions.newSession.fn(context);
  }

  return (
    <div class="h-full overflow-auto">
      <div class="mx-auto flex w-full max-w-2xl flex-col px-6 pt-8 pb-16">
        <header class="mb-12 flex items-center justify-between">
          <span class="text-xl font-black">Laneway</span>
          <Button
            variant="ghost"
            size="sm"
            as="a"
            href="https://github.com/Rkaede/laneway"
            target="_blank"
          >
            <IconGithub class="size-4" />
            GitHub
          </Button>
        </header>

        <h1 class="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Ask GPT, Claude and Gemini at once.
        </h1>
        <p class="mt-3 text-lg text-muted">Compare their answers side by side.</p>

        <ul class="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted">
          <For each={POINTS}>
            {(point) => (
              <li class="flex items-center gap-1.5">
                <IconCircleCheck class="size-4 text-success" />
                {point}
              </li>
            )}
          </For>
        </ul>

        <section
          class="mt-8 rounded-card border bg-surface-raised p-5 shadow-xs"
          aria-labelledby="get-started"
        >
          <h2 id="get-started" class="mb-4 text-lg font-semibold tracking-tight">
            Get started
          </h2>
          <Show
            when={!anyKeysSet()}
            fallback={
              <div class="flex flex-wrap items-center justify-between gap-3">
                <p class="flex items-center gap-1.5">
                  <IconCircleCheck class="size-4 text-success" />
                  Your OpenRouter key is saved.
                </p>
                <Button onClick={startChat}>Start chatting</Button>
              </div>
            }
          >
            <ol class="flex flex-col gap-6">
              <Step number={1} title="Get an OpenRouter key">
                <p class="text-muted">
                  One key reaches every model here. You pay OpenRouter for what you use, and
                  Laneway itself is free.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  as="a"
                  href={OPENROUTER_KEYS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="self-start"
                >
                  Get a key at OpenRouter
                  <IconExternalLink class="size-3.5" />
                </Button>
              </Step>
              <Step number={2} title="Paste it here">
                <ApiKeyForm
                  hideLabel
                  submitLabel="Save and start"
                  hint="Your key stays in this browser. Prompts go to OpenRouter and the model's provider."
                  onSaved={startChat}
                />
              </Step>
            </ol>
          </Show>
        </section>

        <p class="mt-4 text-sm text-muted">
          Want to look around first?{' '}
          <a
            class="font-medium text-main underline underline-offset-4"
            href={`/session/${EXAMPLE_SESSION_ID}`}
          >
            Open an example chat
          </a>
          .
        </p>
      </div>
    </div>
  );
};
