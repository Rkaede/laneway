import { createMemo, createSignal, For, onCleanup, onMount, Show } from 'solid-js';

import { cn } from '~/util';

import { Anthropic, OpenAI } from '../icons/creators';
import { Gemini } from '../icons/models';
import { IconSendHorizontal } from '../icons/ui';

type Reply = {
  model: string;
  icon: typeof OpenAI;
  text: string;
  // Time to first token and time per word, in milliseconds.
  delay: number;
  speed: number;
};

type Script = { prompt: string; replies: Reply[] };

const SCRIPTS: Script[] = [
  {
    prompt: 'Name a coffee shop tucked down a city laneway.',
    replies: [
      {
        model: 'GPT',
        icon: OpenAI,
        text: 'Back Alley Brew. Short, a little cheeky, and easy to say out loud.',
        delay: 350,
        speed: 70,
      },
      {
        model: 'Claude',
        icon: Anthropic,
        text: 'The Narrow Pour, a nod to the lane and to a careful espresso.',
        delay: 650,
        speed: 85,
      },
      {
        model: 'Gemini',
        icon: Gemini,
        text: 'Cobble & Crema. It sounds like the street it sits on.',
        delay: 500,
        speed: 60,
      },
    ],
  },
  {
    prompt: 'Explain recursion in one line.',
    replies: [
      {
        model: 'GPT',
        icon: OpenAI,
        text: 'A function that solves a problem by calling itself on a smaller piece of it.',
        delay: 400,
        speed: 65,
      },
      {
        model: 'Claude',
        icon: Anthropic,
        text: 'To understand recursion, first understand recursion, then stop at the base case.',
        delay: 550,
        speed: 80,
      },
      {
        model: 'Gemini',
        icon: Gemini,
        text: 'Break the problem down until it is small enough to answer directly.',
        delay: 450,
        speed: 70,
      },
    ],
  },
];

const TYPE_SPEED = 35;
const SEND_PAUSE = 450;
const HOLD = 3200;
const FADE = 400;

function timeline(script: Script) {
  const sendAt = script.prompt.length * TYPE_SPEED + SEND_PAUSE;
  const replies = script.replies.map((reply) => {
    const words = reply.text.split(' ');
    const startAt = sendAt + reply.delay;
    return { ...reply, words, startAt, doneAt: startAt + words.length * reply.speed };
  });
  const endAt = Math.max(...replies.map((reply) => reply.doneAt)) + HOLD;
  return { sendAt, replies, endAt };
}

function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/**
 * An animated preview of a multi-model chat for the welcome screen: a prompt is typed, sent, and
 * answered by three models side by side. With reduced motion it shows the finished exchange.
 */
export function WelcomeDemo(props: { class?: string }) {
  const [index, setIndex] = createSignal(0);
  const [elapsed, setElapsed] = createSignal(Number.POSITIVE_INFINITY);

  const script = () => SCRIPTS[index()];
  const plan = createMemo(() => timeline(script()));

  onMount(() => {
    if (prefersReducedMotion()) return;

    let frame = 0;
    let start = performance.now();
    setElapsed(0);

    const tick = (now: number) => {
      let time = now - start;
      if (time >= plan().endAt) {
        setIndex((i) => (i + 1) % SCRIPTS.length);
        start = now;
        time = 0;
      }
      setElapsed(time);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    onCleanup(() => cancelAnimationFrame(frame));
  });

  const typed = createMemo(() => script().prompt.slice(0, Math.floor(elapsed() / TYPE_SPEED)));
  const sent = createMemo(() => elapsed() >= plan().sendAt);
  const fading = createMemo(
    () => Number.isFinite(elapsed()) && elapsed() >= plan().endAt - FADE,
  );

  return (
    <div
      role="img"
      aria-label="Preview: one prompt answered by three models side by side."
      class={cn(
        'flex flex-col gap-3 rounded-card border bg-surface-sunken p-3 shadow-xs select-none',
        props.class,
      )}
    >
      <div
        aria-hidden="true"
        class={cn(
          'flex flex-col gap-3 transition-opacity duration-300',
          fading() && 'opacity-0',
        )}
      >
        <div class="flex min-h-7 justify-end">
          <Show when={sent()}>
            <div class="animate-in rounded-card bg-brand-subtle px-3 py-1 text-sm text-brand-subtle-fg fade-in-0 slide-in-from-bottom-1">
              {script().prompt}
            </div>
          </Show>
        </div>

        <div class="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <For each={plan().replies}>
            {(reply) => {
              const shown = createMemo(() =>
                Math.min(
                  reply.words.length,
                  Math.max(0, Math.floor((elapsed() - reply.startAt) / reply.speed) + 1),
                ),
              );
              const thinking = () => sent() && elapsed() < reply.startAt;
              return (
                <div class="flex min-h-28 flex-col gap-2 rounded-card border bg-surface-raised p-3">
                  <div class="flex items-center gap-1.5 text-xs font-medium text-muted">
                    <reply.icon class="size-3.5" />
                    {reply.model}
                  </div>
                  <Show when={thinking()}>
                    <div class="flex gap-1 py-1.5">
                      <For each={[0, 150, 300]}>
                        {(delay) => (
                          <span
                            class="size-1.5 animate-pulse rounded-full bg-faint"
                            style={{ 'animation-delay': `${delay}ms` }}
                          />
                        )}
                      </For>
                    </div>
                  </Show>
                  <Show when={sent() && !thinking()}>
                    <p class="text-sm leading-snug">
                      {reply.words.slice(0, shown()).join(' ')}
                    </p>
                  </Show>
                </div>
              );
            }}
          </For>
        </div>

        <div class="flex items-center gap-2 rounded-card border bg-surface-input py-1.5 pr-1.5 pl-3 text-sm">
          <div class="min-w-0 flex-1 truncate">
            <Show when={!sent()} fallback={<span class="text-faint">Ask anything…</span>}>
              {typed()}
              <span class="ml-px inline-block h-4 w-px animate-pulse bg-main align-middle" />
            </Show>
          </div>
          <span
            class={cn(
              'flex size-7 shrink-0 items-center justify-center rounded-full transition-colors',
              typed().length > 0 && !sent()
                ? 'bg-brand text-brand-fg'
                : 'bg-surface-hover text-faint',
            )}
          >
            <IconSendHorizontal class="size-3.5" />
          </span>
        </div>
      </div>
    </div>
  );
}
