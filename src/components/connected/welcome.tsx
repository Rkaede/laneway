import { type Component, createSignal, Show } from 'solid-js';

import { Button } from '~/components/ui/button';
import { APIKeySetting } from '~/routes/settings/api-key-settings';
import { setApiKeys } from '~/store/keys';
import { anyKeysSet } from '~/store/selectors';

import { IconArrowLeft, IconCircleCheck, IconGithub, IconKey } from '../icons/ui';

function BulletPoint(props: { description: string; title?: string }) {
  return (
    <li>
      <div class="grid grid-cols-[auto_1fr] items-center gap-x-1">
        <IconCircleCheck class="size-4 text-green-500" />
        <span class="shrink-0 font-bold">{props.title}</span>
        <div />
        <div class="mb-3">{props.description}</div>
      </div>
    </li>
  );
}

export const WelcomeContent: Component<{
  openRouterKey: () => string;
  openAIKey: () => string;
  googleKey: () => string;
  setOpenRouterKey: (value: string) => void;
  setOpenAIKey: (value: string) => void;
  setGoogleKey: (value: string) => void;
}> = () => {
  const [showKeys, setShowKeys] = createSignal(false);

  const handleGetStarted = () => {
    setApiKeys('hasCompletedWelcome', true);
  };

  function handleAddKeys() {
    setShowKeys(true);
  }

  return (
    <div class="mt-16 flex flex-col gap-4">
      <div class="mx-auto w-full max-w-2xl">
        <div class="mb-4 flex w-full gap-2">
          <div class="w-full">
            <h1 class="text-5xl font-black">Laneway</h1>
            <p class="-mt-1.5 mb-4">A local-first AI chat app.</p>

            <div class="overflow-visible">
              <Show when={showKeys() === false}>
                <ul class="mb-4 flex flex-col gap-1" id="intro">
                  <BulletPoint
                    title="Local & Secure"
                    description="All application data is stored locally in your browser."
                  />
                  <BulletPoint
                    title="Direct Connection"
                    description="Use your own API keys to chat with major AI providers."
                  />
                  <BulletPoint
                    title="Frontier Models"
                    description="Access frontier models without juggling multiple subscriptions."
                  />
                  <BulletPoint
                    title="Cost-Effective"
                    description="General usage costs less than an OpenAI subscription."
                  />
                  <BulletPoint
                    title="Multi-Model Chats"
                    description="Interact with and compare multiple AI models side by side."
                  />
                  <BulletPoint
                    title="Powerful Extras"
                    description="Attachments, TTS, model profiles, and multichat presets and more."
                  />
                  <BulletPoint
                    title="Free & Open Source"
                    description="No paid plans, analytics, or annoying funnels & upselling."
                  />
                </ul>
                <div class="mb-4 flex justify-start gap-2">
                  <Button
                    variant="outline"
                    as="a"
                    href="https://github.com/Rkaede/laneway"
                    target="_blank"
                  >
                    <IconGithub class="mr-2 size-4" />
                    View on Github
                  </Button>
                  <Button onClick={handleAddKeys}>
                    <IconKey class="mr-2 size-4" />
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
                      <IconArrowLeft class="mr-2 size-4" />
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
