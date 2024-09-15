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

export const WelcomeDialog: Component = () => {
  const [apiKey, setApiKey] = createSignal('');

  const handleGetStarted = () => {
    if (apiKey()) {
      setApiKeys('openrouter', apiKey());
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
      <DialogContent class="sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Welcome to Laneway 👋</DialogTitle>
        </DialogHeader>
        <DialogDescription>
          <div class="flex flex-col gap-6 py-4">
            <div>
              <p class="mb-2">For the best experience, an OpenRouter key is recommended.</p>
              <p class="mb-2">
                OpenRouter acts as a gateway to multiple AI providers. With a single OpenRouter
                key, you can access all models. You can get a key from their{' '}
                <a href="https://openrouter.ai/keys" target="_blank" rel="noopener noreferrer">
                  keys page
                </a>
                .
              </p>
              <p class="mb-2" />
              <p class="mb-2">
                You can configure other providers like OpenAI and Google later in the settings.
              </p>
              <Input
                data-1p-ignore // disable 1Password extension
                id="apiKey"
                placeholder="Enter your Open Router API key"
                type="password"
                value={apiKey()}
                onInput={(e) => setApiKey(e.currentTarget.value)}
              />
            </div>
          </div>
        </DialogDescription>
        <DialogFooter>
          <Button variant="outline" onClick={handleGetStarted}>
            Later
          </Button>
          <Button onClick={handleGetStarted} disabled={!apiKey()}>
            Continue with Open Router
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
