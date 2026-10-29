import { type Component, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { Button } from '~/components/ui/button';
import { useActionContext } from '~/hooks/use-action-context';
import { setStore } from '~/store';
import { actions } from '~/store/actions';
import { story } from '~/store/examples';
import { anyKeysSet } from '~/store/selectors';

import { IconGithub } from '../icons/ui';
import { ApiKeyForm } from './api-key-form';
import { WelcomeDemo } from './welcome-demo';
import { WELCOME_VARIANTS } from './welcome-variants';

const VARIANT_STORAGE_KEY = 'laneway-welcome-variant';
const EXAMPLE_SESSION_ID = story().session.id;

function readStoredVariant() {
  try {
    const stored = Number(localStorage.getItem(VARIANT_STORAGE_KEY));
    return Number.isInteger(stored) && stored >= 0 && stored < WELCOME_VARIANTS.length
      ? stored
      : 0;
  } catch {
    return 0;
  }
}

function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    target.closest('input, textarea, select, [contenteditable="true"], .cm-editor') !== null
  );
}

/**
 * The first-run page. The root route sends new visitors here once, before they have a key, and
 * it then stays out of the way: New Chat always opens a chat.
 */
export const WelcomeContent: Component = () => {
  const context = useActionContext();
  const [variant, setVariant] = createSignal(readStoredVariant());

  // Press v to cycle through the marketing variants, shift+v to go back. There is no on-screen
  // control for this on purpose.
  function handleVariantKey(event: KeyboardEvent) {
    if (event.key.toLowerCase() !== 'v') return;
    if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;

    event.preventDefault();
    const count = WELCOME_VARIANTS.length;
    const next = (variant() + (event.shiftKey ? -1 : 1) + count) % count;
    setVariant(next);
    try {
      localStorage.setItem(VARIANT_STORAGE_KEY, String(next));
    } catch {
      // Ignore storage errors, the variant just will not persist.
    }
  }

  onMount(() => {
    setStore('settings', 'hasSeenWelcome', true);
    document.addEventListener('keydown', handleVariantKey);
  });
  onCleanup(() => document.removeEventListener('keydown', handleVariantKey));

  function startChat() {
    actions.newSession.fn(context);
  }

  return (
    <div class="h-full overflow-auto">
      <div class="mx-auto mt-16 flex w-full max-w-2xl flex-col px-6 pb-12">
        <h1 class="text-5xl font-black">Laneway</h1>
        <p class="-mt-1.5 mb-4">A local-first AI chat app.</p>

        <div class="mb-6" id="intro">
          <Dynamic component={WELCOME_VARIANTS[variant()]} />
        </div>

        <Show
          when={!anyKeysSet()}
          fallback={
            <div class="flex items-center gap-3">
              <Button onClick={startChat}>Start a chat</Button>
              <span class="text-sm text-muted">Your key is saved. You are ready to go.</span>
            </div>
          }
        >
          <div class="rounded-card border bg-surface-raised p-4 shadow-xs">
            <ApiKeyForm submitLabel="Save and start" onSaved={startChat} />
          </div>
        </Show>

        <div class="mt-3 flex flex-wrap items-center gap-2">
          <Button variant="outline" as="a" href={`/session/${EXAMPLE_SESSION_ID}`}>
            Try an example
          </Button>
          <Show when={!anyKeysSet()}>
            <Button variant="ghost" onClick={startChat}>
              Look around first
            </Button>
          </Show>
          <Button
            variant="ghost"
            as="a"
            href="https://github.com/Rkaede/laneway"
            target="_blank"
            class="ml-auto"
          >
            <IconGithub class="size-4" />
            View on GitHub
          </Button>
        </div>

        <WelcomeDemo class="mt-10" />
      </div>
    </div>
  );
};
