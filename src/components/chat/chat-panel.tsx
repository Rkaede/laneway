import {
  type Component,
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  Show,
} from 'solid-js';

import { requestApiKey } from '~/components/connected/api-key-request';
import { Loader, StreamCursor } from '~/components/ui';
import type { StreamCursorShape } from '~/components/ui/markdown-cursor';
import { getStreamCursor, getStreamDisplayMode } from '~/constants';
import { createPacedText } from '~/hooks/create-paced-text';
import { createStreamFollow, prefersReducedMotion } from '~/hooks/create-stream-follow';
import { createStreamReveal } from '~/hooks/create-stream-reveal';
import { useChat } from '~/hooks/use-chat';
import { STREAM_PACES, type StreamUnit, unitEnds } from '~/services/stream-display';
import { streamAnimation } from '~/services/stream-trials';
import { store } from '~/store';
import { modelsLoaded } from '~/store/models';
import { anyKeysSet } from '~/store/selectors';
import type { ChatProps, ModelProps } from '~/types';

import {
  AlertApiKey,
  AlertError,
  AlertNoVision,
  Chatbar,
  JumpToLatest,
  Message,
} from './components';

type ChatPanelProps = {
  chat: ChatProps;
  attachments?: File[];
  variant?: 'chat' | 'note';
  isExample?: boolean;
  isFirst?: boolean;
  isLast?: boolean;
};

export const ChatPanel: Component<ChatPanelProps> = (props) => {
  const chat = useChat({ chat: props.chat, readOnly: () => props.isExample });
  const [lane, setLane] = createSignal<HTMLDivElement>();
  const follow = createStreamFollow(lane);
  const mode = () => getStreamDisplayMode(store.settings.streaming?.display).id;

  // The answer is shown a word, a sentence or a paragraph at a time, unless it is held back whole.
  const unit = (): StreamUnit | undefined => {
    const current = mode();
    return current === 'complete' ? undefined : current;
  };
  const pacing = createMemo(() => {
    const current = unit();
    // Reduced motion gets text as it arrives, without words appearing one by one.
    if (!current || (current === 'live' && prefersReducedMotion())) return undefined;
    return { ...STREAM_PACES[current], ends: (text: string) => unitEnds(text, current) };
  });
  // The transport keeps streaming into the store. Only what the lane shows is held back.
  const incoming = createPacedText(() => {
    const content = props.chat.latest?.content;
    return unit() && typeof content === 'string' ? content : '';
  }, pacing);
  const hasIncoming = () => !!props.chat.latest?.content;
  const cursor = (): StreamCursorShape | undefined => {
    const { id } = getStreamCursor(store.settings.streaming?.cursor);
    return id === 'dots' ? undefined : id;
  };
  const reveal = createStreamReveal(lane, {
    pieces: () => {
      const current = unit();
      if (!current || !streamAnimation(current).keyframes) return undefined;
      return current === 'paragraphs' ? 'blocks' : 'words';
    },
    animation: () => streamAnimation(unit() ?? 'live'),
    status: () => props.chat.status,
  });

  // An answer that was held back until it finished is read from its start, not from its end.
  let streamed = false;
  createEffect(() => {
    if (props.chat.status === 'loading') streamed = true;
  });
  createEffect(
    on(
      () => props.chat.messages.at(-1)?.id,
      (id) => {
        const wasHeldBack = streamed && mode() === 'complete';
        streamed = false;
        if (!id || props.chat.messages.at(-1)?.role !== 'assistant') return;
        if (!wasHeldBack || !follow.following()) return;
        follow.revealFromStart(lane()?.querySelector(`[data-message-id="${id}"]`));
      },
      { defer: true },
    ),
  );

  // The streamed text is not announced word by word, so the lane announces its progress instead.
  const [announcement, setAnnouncement] = createSignal('');
  createEffect(
    on(
      () => props.chat.status,
      (status, previous) => {
        if (status === 'loading') {
          setAnnouncement(
            mode() === 'complete' ? 'Writing response. It will appear when done.' : '',
          );
        } else if (previous === 'loading' && status === 'idle') {
          setAnnouncement('Response complete.');
        } else if (previous === 'loading' && status === 'canceled') {
          setAnnouncement('Response stopped.');
        }
      },
      { defer: true },
    ),
  );

  return (
    <div
      ref={setLane}
      classList={{
        'group relative min-w-0 max-w-[70ch] grid-rows-[auto] flex flex-col': true,
        'min-h-full flex-1': props.chat.messages.length > 0,
        'w-full': props.variant === 'note',
      }}
    >
      <Chatbar
        assistant={chat.assistant()}
        model={chat.model()}
        type={props.chat.assistantId ? 'assistant' : 'model'}
        isFirst={props.isFirst}
        isLast={props.isLast}
      />
      <div class="sr-only" role="status">
        {announcement()}
      </div>
      <div class="fade-out-bottom flex min-h-full flex-1 flex-col px-1.5">
        <div class="flex min-h-full flex-1 flex-col gap-8 pt-8 pb-8">
          <For each={props.chat.messages}>
            {(message) => (
              <Message
                {...message}
                model={chat.model()}
                tts={!props.isExample && store.settings.tts.enabled}
                wordSpans={
                  reveal.wordSpans() &&
                  message.role === 'assistant' &&
                  message.id === props.chat.messages.at(-1)?.id
                }
              />
            )}
          </For>

          <Show when={incoming()}>
            {(text) => (
              // The wrapper adds no box. It tells the block reveal which message is streaming.
              <div class="contents" data-incoming-message>
                <IncomingMessage
                  id={props.chat.latest?.id}
                  text={text()}
                  wordSpans={reveal.wordSpans()}
                  cursor={cursor()}
                  model={chat.model()}
                />
              </div>
            )}
          </Show>

          <Show when={props.chat.status === 'loading' && !incoming()}>
            <div
              class="flex flex-col gap-1"
              classList={{
                'items-center': !cursor(),
                // A cursor stands where the first line of the answer will start.
                'items-start px-agent-x py-bubble-y': !!cursor(),
              }}
            >
              <Show when={cursor()} fallback={<Loader />}>
                {(shape) => (
                  <div class="px-1 text-base leading-relaxed">
                    <StreamCursor shape={shape()} />
                  </div>
                )}
              </Show>
              <Show when={mode() === 'complete' && hasIncoming()}>
                <p class="text-xs text-muted">Writing the answer. It will appear when done.</p>
              </Show>
            </div>
          </Show>

          <Show
            when={props.attachments && props.attachments.length > 0 && !chat.model()?.vision}
          >
            <AlertNoVision />
          </Show>

          {/* With no key at all, the composer already asks for one. */}
          <Show
            when={
              !props.isExample && modelsLoaded() && anyKeysSet() && !chat.isApiKeyConfigured()
            }
          >
            <AlertApiKey onAddKey={() => requestApiKey()} />
          </Show>

          <Show when={props.chat.error}>
            {(error) => <AlertError error={error()} onRetry={() => chat.clearError()} />}
          </Show>
        </div>
      </div>
      <Show when={follow.away()}>
        <div class="pointer-events-none sticky bottom-4 z-10 h-0">
          <div class="absolute bottom-0 left-1/2 -translate-x-1/2">
            <JumpToLatest class="pointer-events-auto shadow-md" onClick={follow.jump} />
          </div>
        </div>
      </Show>
    </div>
  );
};

function IncomingMessage(props: {
  id?: string;
  text: string;
  wordSpans: boolean;
  cursor?: StreamCursorShape;
  model?: ModelProps;
}) {
  return (
    <Message
      content={props.text}
      role="assistant"
      status="loading"
      wordSpans={props.wordSpans}
      cursor={props.cursor}
      id={props.id ?? 'incoming'}
      model={props.model}
    />
  );
}
