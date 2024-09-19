import { useNavigate } from '@solidjs/router';
import { type Component, createEffect, For, Show } from 'solid-js';

import { Loader } from '~/components/ui';
import { useChat } from '~/hooks/use-chat';
import providers from '~/services';
import { store } from '~/store';
import { addMessage, chatError, clearChatError } from '~/store/actions';
import { apiKeys } from '~/store/keys';
import { models } from '~/store/models';
import type { ChatProps } from '~/types';

import { AlertApiKey, AlertError, AlertNoVision, Chatbar, Message } from './components';

type ChatPanelProps = {
  sessionId: string;
  chat: ChatProps;
  onChangeAssistant: (id: string) => void;
  attachments?: File[];
};

export const ChatPanel: Component<ChatPanelProps> = (props) => {
  const navigate = useNavigate();
  const assistant = () => store.assistants.find((a) => a.id === props.chat.assistantId);
  const model = () =>
    models.find((m) => m.id === assistant()?.modelId) ??
    models.find((m) => m.id === props.chat.modelId);

  const provider = () => {
    const openRouterUsage = store.settings.openRouterUsage;
    const modelProviders = model()?.provider;

    const primaryProvider = modelProviders?.find((h) => h.primary);
    const openrouterProvider = modelProviders?.find((h) => h.id === 'openrouter');
    const isOpenRouterConfigured = !!apiKeys?.openrouter;

    if (openRouterUsage === 'always' && openrouterProvider && isOpenRouterConfigured) {
      return openrouterProvider;
    }

    if (openRouterUsage === 'fallback' && primaryProvider) {
      const primaryProviderId = primaryProvider.id;
      const isPrimaryApiKeySet = !!apiKeys?.[primaryProviderId];

      if (isPrimaryApiKeySet) {
        return primaryProvider;
      }
      if (openrouterProvider) {
        return openrouterProvider;
      }
    }

    return primaryProvider;
  };

  const providerService = () => {
    const _provider = provider();

    if (!_provider) return undefined;
    return providers[_provider.id];
  };

  const isApiKeyConfigured = () => {
    const providerId = provider()?.id;

    if (!providerId) return false;
    return !!apiKeys?.[providerId];
  };

  const chat = useChat({
    streamFn: () => {
      const systemPrompt = assistant()?.systemPrompt;
      const messagesWithSystem = systemPrompt
        ? [
            {
              role: 'system' as const,
              content: systemPrompt,
            },
            ...props.chat.messages,
          ]
        : props.chat.messages;
      return providerService()?.getStream(messagesWithSystem, provider()?.modelId);
    },
    onFinish: (message) => {
      addMessage(props.chat.id, message);
    },
    onError: (error) => {
      chatError(props.chat.id, { name: error.name, message: error.message });
    },
  });

  createEffect(() => {
    if (props.chat.error || model()?.provider === undefined) {
      return;
    }

    const latestMessage = props.chat.messages.at(-1);

    const hasVision = model()?.vision === true;
    const hasImage =
      Array.isArray(latestMessage?.content) &&
      latestMessage?.content.some((part) => part.type === 'image');
    const shouldSend = hasImage ? hasVision : true;

    if (!shouldSend) {
      return;
    }

    if (props.chat.messages.at(-1)?.role === 'user') {
      const _provider = model()?.provider;
      if (_provider) {
        const systemPrompt = assistant()?.systemPrompt;
        const messagesWithSystem = systemPrompt
          ? [
              {
                role: 'system' as const,
                content: systemPrompt,
              },
              ...props.chat.messages,
            ]
          : props.chat.messages;
        chat.append(messagesWithSystem);
      }
    }
  });

  return (
    <div
      classList={{
        'group relative min-w-0 max-w-[70ch] grid-rows-[auto] flex-col': true,
        'min-h-full flex-1': props.chat.messages.length > 0,
      }}
    >
      <Chatbar
        chat={props.chat}
        assistant={assistant()}
        model={model()}
        provider={provider()}
        type={props.chat.assistantId ? 'assistant' : 'model'}
      />
      <div class="fade-out-bottom flex flex-col gap-8 pb-2 pt-8">
        <Show when={props.chat}>
          <For each={props.chat.messages}>
            {(message) => <Message {...message} model={model()} />}
          </For>
        </Show>

        <Show when={chat.latest}>
          {(message) => <Message content={message().content} role="assistant" />}
        </Show>

        <Show when={chat.status === 'loading'}>
          <div class="flex justify-center">
            <Loader />
          </div>
        </Show>

        <Show when={props.attachments && props.attachments.length > 0 && !model()?.vision}>
          <AlertNoVision />
        </Show>

        <Show when={!isApiKeyConfigured()}>
          <AlertApiKey onNavigateToSettings={() => navigate('/settings')} />
        </Show>

        <Show when={props.chat.error}>
          {(error) => (
            <AlertError error={error()} onRetry={() => clearChatError(props.chat.id)} />
          )}
        </Show>
      </div>
    </div>
  );
};
