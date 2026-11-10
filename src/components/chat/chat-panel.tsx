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
import { Loader } from '~/components/ui';
import { getStreamDisplayMode } from '~/constants';
import { createAnimatedText } from '~/hooks/create-animated-text';
import { createStreamFollow, prefersReducedMotion } from '~/hooks/create-stream-follow';
import { useChat } from '~/hooks/use-chat';
import { visibleStreamText } from '~/services/stream-display';
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

  // The transport keeps streaming into the store. Only what the lane shows is held back.
  const incoming = createMemo(() => {
    const content = props.chat.latest?.content;
    return visibleStreamText(typeof content === 'string' ? content : '', mode());
  });
  const hasIncoming = () => !!props.chat.latest?.content;

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
              />
            )}
          </For>

          <Show when={incoming()}>
            {(text) => (
              <IncomingMessage
                id={props.chat.latest?.id}
                text={text()}
                animate={mode() === 'live'}
                model={chat.model()}
              />
            )}
          </Show>

          <Show when={props.chat.status === 'loading' && !incoming()}>
            <div class="flex flex-col items-center gap-1">
              <Loader />
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
  animate: boolean;
  model?: ModelProps;
}) {
  const animated = createAnimatedText(() => props.text, { type: 'word' });
  // Paragraphs are shown whole, and reduced motion gets the text without the word fade.
  const text = () =>
    props.animate && !prefersReducedMotion() ? animated.animatedText() : props.text;
  return (
    <Message
      content={text()}
      role="assistant"
      id={props.id ?? 'incoming'}
      model={props.model}
    />
  );
}
