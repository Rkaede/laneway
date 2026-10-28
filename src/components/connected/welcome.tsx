import { type Component, createSignal, onCleanup, onMount, Show } from 'solid-js';
import { Dynamic } from 'solid-js/web';

import { Button } from '~/components/ui/button';
import { APIKeySetting } from '~/routes/settings/api-key-settings';
import { setApiKeys } from '~/store/keys';
import { anyKeysSet } from '~/store/selectors';

import { IconArrowLeft, IconGithub, IconKey } from '../icons/ui';
import { WELCOME_VARIANTS } from './welcome-variants';

const VARIANT_STORAGE_KEY = 'laneway-welcome-variant';

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

export const WelcomeContent: Component<{
  openRouterKey: () => string;
  openAIKey: () => string;
  setOpenRouterKey: (value: string) => void;
  setOpenAIKey: (value: string) => void;
}> = () => {
  const [showKeys, setShowKeys] = createSignal(false);
  const [variant, setVariant] = createSignal(readStoredVariant());

  // Press v to cycle through the marketing variants, shift+v to go back. There is no on-screen
  // control for this on purpose.
  function handleVariantKey(event: KeyboardEvent) {
    if (event.key.toLowerCase() !== 'v' || showKeys()) return;
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

  onMount(() => document.addEventListener('keydown', handleVariantKey));
  onCleanup(() => document.removeEventListener('keydown', handleVariantKey));

  const handleGetStarted = () => {
    setApiKeys('hasCompletedWelcome', true);
  };

  function handleAddKeys() {
    setShowKeys(true);
  }

  return (
    <div class="mt-16 flex flex-col gap-4 px-6">
      <div class="mx-auto w-full max-w-2xl">
        <div class="mb-4 flex w-full gap-2">
          <div class="w-full">
            <h1 class="text-5xl font-black">Laneway</h1>
            <p class="-mt-1.5 mb-4">A local-first AI chat app.</p>

            <div class="overflow-visible">
              <Show when={showKeys() === false}>
                <div class="mb-6" id="intro">
                  <Dynamic component={WELCOME_VARIANTS[variant()]} />
                </div>
                <div class="mb-4 flex justify-start gap-2">
                  <Button
                    variant="outline"
                    as="a"
                    href="https://github.com/Rkaede/laneway"
                    target="_blank"
                  >
                    <IconGithub class="size-4" />
                    View on Github
                  </Button>
                  <Button onClick={handleAddKeys}>
                    <IconKey class="size-4" />
                    Enter API Keys
                  </Button>
                </div>
              </Show>
              <Show when={showKeys()}>
                <div class="mb-4 flex justify-end gap-2">
                  <APIKeySetting />
                </div>
                <div class="flex justify-between">
                  <div>
                    <Button variant="outline" onClick={() => setShowKeys(!showKeys())}>
                      <IconArrowLeft class="size-4" />
                      Back
                    </Button>
                  </div>
                  <div class="mb-4 flex justify-end gap-2">
                    <Button onClick={handleGetStarted} disabled={!anyKeysSet()}>
                      Save & Get Started
                    </Button>
                  </div>
                </div>
              </Show>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
