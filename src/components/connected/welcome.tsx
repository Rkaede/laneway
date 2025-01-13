import { type Component, createSignal } from 'solid-js';

import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Input } from '~/components/ui/input';
import { setStore, store } from '~/store';
import { apiKeys, setApiKeys } from '~/store/keys';

import { Google, OpenAI, OpenRouter } from '../icons/creators';

export const WelcomeDialog: Component = () => {
  const [openRouterKey, setOpenRouterKey] = createSignal('');
  const [openAIKey, setOpenAIKey] = createSignal('');
  const [googleKey, setGoogleKey] = createSignal('');

  const handleGetStarted = () => {
    if (openRouterKey()) {
      setApiKeys('openrouter', openRouterKey());
    }
    if (openAIKey()) {
      setApiKeys('openai', openAIKey());
    }
    if (googleKey()) {
      setApiKeys('google', googleKey());
    }
    closeDialog();
  };

  function closeDialog() {
    setStore('settings', 'hasSeenWelcome', true);
  }

  const anyKeysSet = () => {
    return !!apiKeys?.openai || !!apiKeys?.google || !!apiKeys?.openrouter;
  };

  return (
    <Dialog open={!anyKeysSet() && !store.settings.hasSeenWelcome}>
      <DialogContent class="bg-gradient-to-br from-background to-background/80 backdrop-blur-sm sm:max-w-[800px]">
        <DialogHeader class="mx-auto text-center">
          <DialogTitle class="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-2xl font-bold">
            Welcome to Laneway 👋
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <div class="flex flex-col gap-4">
            <div class="mx-auto w-full max-w-2xl">
              <div class="mb-4 flex w-full gap-2">
                <div>
                  <p class="text-left text-sm leading-relaxed text-foreground/90">
                    Laneway is a full client-side AI chat app.
                  </p>
                  <ul class="list-inside list-disc text-left text-sm">
                    <li>No middleman - connect directly to AI providers with your API keys.</li>
                    <li>
                      All data is stored locally in your browser for both speed and privacy.
                    </li>
                    <li>
                      Chat with multiple frontier AI models without individual subscriptions,
                      even at the same time!
                    </li>
                  </ul>
                </div>
              </div>
              <hr class="mb-4" />
              <p class="mb-4 text-lg font-medium text-primary">Configure your API keys</p>
              <div class="s mb-4 rounded-xl border-primary/20 bg-primary/5 p-4">
                <div class="mb-2 flex items-center gap-2">
                  <div class="flex size-8 items-center justify-center rounded-full bg-primary/10">
                    <OpenRouter class="size-5 text-primary" />
                  </div>
                  <p class="text-base font-semibold">OpenRouter</p>
                </div>
                <p class="mb-2 text-sm text-foreground/80">
                  Access all AI models through a single key. Get one from their{' '}
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-primary hover:underline"
                  >
                    keys page
                  </a>
                  .
                </p>
                <Input
                  data-1p-ignore
                  placeholder="Enter your OpenRouter API key"
                  type="password"
                  value={openRouterKey()}
                  onInput={(e) => setOpenRouterKey(e.currentTarget.value)}
                  class="bg-background/50"
                />
              </div>

              <div class="space-y-4">
                <p class="text-xs font-medium text-muted-foreground">
                  Or configure individual provider keys:
                </p>

                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div class="rounded-lg border bg-primary/5 p-3 shadow-sm">
                    <div class="mb-2 flex items-center gap-2">
                      <div class="flex size-6 items-center justify-center rounded-full bg-[#74AA9C]/10">
                        <OpenAI class="size-4 text-[#74AA9C]" />
                      </div>
                      <p class="text-sm font-medium">OpenAI</p>
                    </div>
                    <p class="mb-2 text-xs text-muted-foreground">
                      For ChatGPT models. Get a key from{' '}
                      <a
                        href="https://platform.openai.com/api-keys"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-primary hover:underline"
                      >
                        OpenAI
                      </a>
                      .
                    </p>
                    <Input
                      data-1p-ignore
                      placeholder="Enter your OpenAI API key"
                      type="password"
                      value={openAIKey()}
                      onInput={(e) => setOpenAIKey(e.currentTarget.value)}
                      class="bg-background/50"
                    />
                  </div>

                  <div class="rounded-lg border bg-primary/5 p-3 shadow-sm">
                    <div class="mb-2 flex items-center gap-2">
                      <div class="flex size-6 items-center justify-center rounded-full bg-[#4285F4]/10">
                        <Google class="size-4 text-[#4285F4]" />
                      </div>
                      <p class="text-sm font-medium">Google</p>
                    </div>
                    <p class="mb-2 text-xs text-muted-foreground">
                      For Gemini models. Get a key from{' '}
                      <a
                        href="https://aistudio.google.com/app/"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="text-primary hover:underline"
                      >
                        Google AI Studio
                      </a>
                      .
                    </p>
                    <Input
                      data-1p-ignore
                      placeholder="Enter your Google API key"
                      type="password"
                      value={googleKey()}
                      onInput={(e) => setGoogleKey(e.currentTarget.value)}
                      class="bg-background/50"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogDescription>
        <DialogFooter class="mt-4 gap-3 sm:justify-center">
          <Button variant="outline" onClick={handleGetStarted} class="min-w-[100px]">
            Later
          </Button>
          <Button
            onClick={handleGetStarted}
            disabled={!openRouterKey() && !openAIKey() && !googleKey()}
            class="min-w-[100px] bg-gradient-to-r from-primary to-primary/80 hover:opacity-90"
          >
            Get Started
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
