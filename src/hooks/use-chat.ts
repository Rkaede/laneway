import { nanoid } from 'nanoid';
import { createEffect, mergeProps } from 'solid-js';
import { createStore } from 'solid-js/store';

import providers from '~/services';
import { store } from '~/store';
import { addMessage, chatError, clearChatError } from '~/store/actions';
import { apiKeys } from '~/store/keys';
import { models } from '~/store/models';
import type { ChatProps, MessageProps } from '~/types';

type UseChat = {
  // todo: fix this type
  chat: ChatProps;
};

type ChatStore = {
  latest: MessageProps | undefined;
  status: 'idle' | 'loading' | 'error';
  append: (messages: MessageProps[]) => Promise<void>;
};

export function useChat({ chat }: UseChat) {
  const assistant = () => store.assistants.find((a) => a.id === chat.assistantId);
  const model = () =>
    models.find((m) => m.id === assistant()?.modelId) ??
    models.find((m) => m.id === chat.modelId);

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

  function clearError() {
    clearChatError(chat.id);
  }

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

  const streamFn = () => {
    const systemPrompt = assistant()?.systemPrompt;
    const messagesWithSystem = systemPrompt
      ? [{ id: nanoid(), role: 'system' as const, content: systemPrompt }, ...chat.messages]
      : chat.messages;
    return providerService()?.getStream(messagesWithSystem, provider()?.modelId);
  };

  const [chatStore, setChatStore] = createStore<ChatStore>({
    latest: undefined as MessageProps | undefined,
    status: 'idle',
    append: async () => {
      try {
        setChatStore('status', 'loading');
        const startTime = Date.now();

        const stream = await streamFn();
        if (!stream) return;
        let latestContent = '';

        for await (const textPart of stream.textStream) {
          latestContent += textPart;
          setChatStore('latest', { role: 'assistant', content: latestContent });
        }

        const usage = await stream.usage;
        const timeTaken = Date.now() - startTime;

        setChatStore({ status: 'idle', latest: undefined });
        addMessage(chat.id, {
          id: nanoid(),
          role: 'assistant',
          content: latestContent,
          usage: {
            promptTokens: usage.promptTokens,
            completionTokens: usage.completionTokens,
            totalTokens: usage.totalTokens,
            created: Date.now(),
            timeTaken,
          },
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          setChatStore({ status: 'error', latest: undefined });
          chatError(chat.id, { name: error.name, message: error.message });
        }
      }
    },
  });

  createEffect(() => {
    if (chat.error || model()?.provider === undefined) {
      return;
    }

    const latestMessage = chat.messages.at(-1);
    const hasVision = model()?.vision === true;
    const hasImage =
      Array.isArray(latestMessage?.content) &&
      latestMessage?.content.some((part) => part.type === 'image');
    const shouldSend = hasImage ? hasVision : true;

    if (!shouldSend) {
      return;
    }

    if (chat.messages.at(-1)?.role === 'user') {
      const _provider = model()?.provider;
      if (_provider) {
        const systemPrompt = assistant()?.systemPrompt;
        const messagesWithSystem = systemPrompt
          ? [{ id: nanoid(), role: 'system' as const, content: systemPrompt }, ...chat.messages]
          : chat.messages;
        chatStore.append(messagesWithSystem);
      }
    }
  });

  const chatHook = mergeProps(chatStore, {
    isApiKeyConfigured,
    providerService,
    clearError,
    assistant,
    provider,
    model,
  });

  return chatHook;
}
