import { useNavigate } from '@solidjs/router';
import { type Component, For, Show } from 'solid-js';

import { Loader } from '~/components/ui';
import { useChat } from '~/hooks/use-chat';
import { store } from '~/store';
import type { ChatProps } from '~/types';

import { AlertApiKey, AlertError, AlertNoVision, Chatbar, Message } from './components';

type ChatPanelProps = {
  sessionId: string;
  chat: ChatProps;
  onChangeAssistant?: (id: string) => void;
  attachments?: File[];
  variant?: 'chat' | 'note';
};

export const ChatPanel: Component<ChatPanelProps> = (props) => {
  const navigate = useNavigate();
  const chat = useChat({
    chat: props.chat,
  });

  return (
    <div
      classList={{
        'group relative min-w-0 max-w-[70ch] grid-rows-[auto] flex flex-col': true,
        'min-h-full flex-1': props.chat.messages.length > 0,
        'w-full': props.variant === 'note',
      }}
    >
      <Chatbar
        chat={props.chat}
        assistant={chat.assistant()}
        model={chat.model()}
        provider={chat.provider()}
        type={props.chat.assistantId ? 'assistant' : 'model'}
        sessionType={props.variant}
      />
      <div class="fade-out-bottom flex min-h-full flex-1 flex-col px-1.5">
        <div class="flex min-h-full flex-1 flex-col gap-8 pb-2 pt-8">
          <Show when={props.chat}>
            <For each={props.chat.messages}>
              {(message) => (
                <Message
                  {...message}
                  model={chat.model()}
                  tts={store.settings.tts.enabled && message.role === 'assistant'}
                />
              )}
            </For>
          </Show>

          <Show when={chat.latest}>
            {(message) => (
              <Message content={message().content} role="assistant" id={message().id} />
            )}
          </Show>

          <Show when={chat.status === 'loading'}>
            <div class="flex justify-center">
              <Loader />
            </div>
          </Show>

          <Show
            when={props.attachments && props.attachments.length > 0 && !chat.model()?.vision}
          >
            <AlertNoVision />
          </Show>

          <Show when={!chat.isApiKeyConfigured()}>
            <AlertApiKey onNavigateToSettings={() => navigate('/settings')} />
          </Show>

          <Show when={props.chat.error}>
            {(error) => <AlertError error={error()} onRetry={() => chat.clearError()} />}
          </Show>
        </div>
      </div>
    </div>
  );
};
