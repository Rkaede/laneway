import { type Component, For, type JSX } from 'solid-js';

import {
  IconBot,
  IconCircleCheck,
  IconEyeOff,
  IconGlobe,
  IconLayoutGrid,
  IconSearch,
  IconSpeaker,
  IconSquarePen,
} from '../icons/ui';

type IconComponent = (props: { class?: string }) => JSX.Element;

/**
 * Alternative marketing blocks for the welcome screen. Each one replaces the area between the
 * "Laneway" heading and the call-to-action buttons. The welcome screen cycles through them with a
 * shortcut key, so they all stick to what the app actually does.
 */

function Heading(props: { children: JSX.Element }) {
  return <h2 class="text-2xl leading-tight font-semibold tracking-tight">{props.children}</h2>;
}

function Statement() {
  const points = ['No account', 'No middleman', 'Open source'];

  return (
    <div class="flex flex-col gap-4">
      <Heading>Every model. One window. Your own keys.</Heading>
      <p class="max-w-xl text-muted">
        Laneway talks straight to OpenAI and OpenRouter from your browser. Your chat history is
        stored locally, while prompts and conversation context are sent to your chosen
        providers.
      </p>
      <ul class="flex flex-wrap gap-x-5 gap-y-2">
        <For each={points}>
          {(point) => (
            <li class="flex items-center gap-1.5 font-medium">
              <IconCircleCheck class="size-4 text-success" />
              {point}
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}

function Pillars() {
  const pillars: { icon: IconComponent; title: string; text: string }[] = [
    {
      icon: IconGlobe,
      title: 'No middleman',
      text: 'Requests go from your browser straight to the provider you choose.',
    },
    {
      icon: IconEyeOff,
      title: 'Private by default',
      text: 'Chats and settings are stored locally in your browser.',
    },
    {
      icon: IconLayoutGrid,
      title: 'Many models, one chat',
      text: 'Ask several models at once and compare their answers.',
    },
  ];

  return (
    <div class="flex flex-col gap-5">
      <Heading>Bring your own keys.</Heading>
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <For each={pillars}>
          {(pillar) => (
            <div class="flex flex-col gap-2 rounded-card border bg-surface-raised p-4 shadow-xs">
              <pillar.icon class="size-5 text-brand" />
              <h3 class="font-semibold">{pillar.title}</h3>
              <p class="text-muted">{pillar.text}</p>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

function Compare() {
  const models = ['GPT-4o', 'Claude', 'Gemini'];
  const lineWidths = ['w-full', 'w-11/12', 'w-4/5', 'w-2/3'];

  return (
    <div class="flex flex-col gap-4">
      <Heading>Ask once. Compare everything.</Heading>
      <p class="max-w-xl text-muted">
        Send one prompt to several models at the same time and read the answers side by side.
      </p>
      <div class="grid grid-cols-3 gap-3" aria-hidden="true">
        <For each={models}>
          {(model) => (
            <div class="flex flex-col gap-2 rounded-card border bg-surface-raised p-3 shadow-xs">
              <div class="flex items-center gap-1.5 font-medium">
                <IconBot class="size-4 text-muted" />
                {model}
              </div>
              <For each={lineWidths}>
                {(width) => <div class={`h-2 rounded-full bg-surface-sunken ${width}`} />}
              </For>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}

function FeatureGrid() {
  const features: { icon: IconComponent; title: string; text: string }[] = [
    {
      icon: IconLayoutGrid,
      title: 'Multi-model chats',
      text: 'Compare several models in one session.',
    },
    {
      icon: IconBot,
      title: 'Custom assistants',
      text: 'Save a model with its own prompt and settings.',
    },
    {
      icon: IconLayoutGrid,
      title: 'Presets',
      text: 'Chat with several assistants at once.',
    },
    {
      icon: IconSquarePen,
      title: 'Notes',
      text: 'Iterate on a single prompt.',
    },
    {
      icon: IconSpeaker,
      title: 'Text to speech',
      text: 'Listen to any reply with an OpenAI key.',
    },
    {
      icon: IconSearch,
      title: 'Command palette',
      text: 'Press Cmd or Ctrl and K to do anything.',
    },
  ];

  return (
    <div class="flex flex-col gap-5">
      <Heading>Everything in one place.</Heading>
      <ul class="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
        <For each={features}>
          {(feature) => (
            <li class="flex items-start gap-3">
              <feature.icon class="mt-0.5 size-5 shrink-0 text-brand" />
              <div>
                <div class="font-semibold">{feature.title}</div>
                <div class="text-muted">{feature.text}</div>
              </div>
            </li>
          )}
        </For>
      </ul>
    </div>
  );
}

function Steps() {
  const steps = [
    {
      title: 'Add an API key',
      text: 'OpenAI or OpenRouter. It stays in your browser.',
    },
    {
      title: 'Pick a model',
      text: 'Or pick several and compare them.',
    },
    {
      title: 'Start chatting',
      text: 'Everything is saved locally as you go.',
    },
  ];

  return (
    <div class="flex flex-col gap-5">
      <Heading>Three steps to your first chat.</Heading>
      <ol class="flex flex-col gap-4">
        <For each={steps}>
          {(step, index) => (
            <li class="flex items-start gap-3">
              <span class="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand-subtle text-xs font-semibold text-brand-subtle-fg tabular-nums">
                {index() + 1}
              </span>
              <div>
                <div class="font-semibold">{step.title}</div>
                <div class="text-muted">{step.text}</div>
              </div>
            </li>
          )}
        </For>
      </ol>
    </div>
  );
}

export const WELCOME_VARIANTS: Component[] = [Statement, Pillars, Compare, FeatureGrid, Steps];
