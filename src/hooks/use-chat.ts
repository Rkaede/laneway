import { nanoid } from 'nanoid';
import { createEffect, mergeProps, onCleanup } from 'solid-js';
import { createStore } from 'solid-js/store';

import { useSession } from '~/components/connected/session-context';
import { store } from '~/store';
import { addMessage, chatError, clearChatError } from '~/store/actions';
import { apiKeys } from '~/store/keys';
import { models } from '~/store/models';
import type { ChatProps, MessageProps } from '~/types';
const router = import('~/services/llm');

type UseChat = {
  // todo: fix this type
  chat: ChatProps;
};

type ChatStore = {
  latest: MessageProps | undefined;
  status: 'idle' | 'loading' | 'error' | 'canceled';
  append: (messages: MessageProps[]) => Promise<void>;
  abortController: AbortController | undefined;
  cancel: () => void;
};

export function useChat({ chat }: UseChat) {
  const session = useSession();

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

  const isApiKeyConfigured = () => {
    const providerId = provider()?.id;

    if (!providerId) return false;
    return !!apiKeys?.[providerId];
  };

  const streamFn = async (abortSignal: AbortSignal) => {
    const systemPrompt = assistant()?.systemPrompt;
    const messagesWithSystem = systemPrompt
      ? [{ id: nanoid(), role: 'system' as const, content: systemPrompt }, ...chat.messages]
      : chat.messages;

    const llm = await router;
    return llm.getStream(messagesWithSystem, provider()?.modelId, provider()?.id, {
      abortSignal,
    });
  };

  const [chatStore, setChatStore] = createStore<ChatStore>({
    latest: undefined as MessageProps | undefined,
    status: 'idle',
    abortController: undefined,
    cancel: () => {
      chatStore.abortController?.abort();
      addMessage(chat.id, {
        id: nanoid(),
        role: 'assistant',
        content: chatStore.latest?.content ?? '',
        cancelled: true,
        usage: {
          created: Date.now(),
          timeTaken: 0,
        },
      });
      setChatStore('latest', undefined);
      setChatStore('status', 'canceled');
    },
    append: async () => {
      try {
        setChatStore('status', 'loading');
        session.addLoadingChat(chat.id);
        const startTime = Date.now();

        const controller = new AbortController();
        setChatStore('abortController', controller);

        const stream = await streamFn(controller.signal);
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
        if (error instanceof Error && error.name !== 'AbortError') {
          setChatStore({ status: 'error', latest: undefined });
          chatError(chat.id, { name: error.name, message: error.message });
        } else {
          setChatStore({ status: 'idle', latest: undefined });
        }
      } finally {
        setChatStore('abortController', undefined);
      }
    },
  });

  createEffect(() => {
    session.registerChatCancel(chat.id, chatStore.cancel);
    onCleanup(() => {
      session.removeLoadingChat(chat.id);
    });
  });

  createEffect(() => {
    if (chatStore.status === 'loading') {
      session.addLoadingChat(chat.id);
    } else {
      session.removeLoadingChat(chat.id);
    }
  });

  // Automatically sends new user messages to the AI model, checking for vision capabilities if
  // images are present and prepending any system prompt from the assistant
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

    if (latestMessage?.role === 'user') {
      if (model()?.provider) {
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
    clearError,
    assistant,
    provider,
    model,
  });

  return chatHook;
}
