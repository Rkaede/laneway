import { nanoid } from 'nanoid';
import { createEffect, mergeProps } from 'solid-js';
import { createStore } from 'solid-js/store';

import { getProvider } from '~/services/util';
import { setStore, store } from '~/store';
import { clearChatError } from '~/store/actions';
import { apiKeys } from '~/store/keys';
import { models } from '~/store/models';
import type { ChatProps, MessageProps } from '~/types';
const router = import('~/services/llm');
import { append, cancel } from '~/services/chat-controller';

type UseChat = {
  chat: ChatProps;
};

type ChatStore = {
  latest: MessageProps | undefined;
  append: (messages: MessageProps[]) => Promise<void>;
  cancel: () => void;
};

export function useChat({ chat }: UseChat) {
  const assistant = () => store.assistants.find((a) => a.id === chat.assistantId);
  const model = () =>
    models.find((m) => m.id === assistant()?.modelId) ??
    models.find((m) => m.id === chat.modelId);

  const provider = () => {
    const modelId = model()?.id;
    if (!modelId) return undefined;
    return getProvider(modelId);
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

  const [chatStore] = createStore<ChatStore>({
    latest: undefined as MessageProps | undefined,
    cancel: () => {
      cancel({ chatId: chat.id });
    },
    append: async () => {
      append({ chatId: chat.id, streamFn });
    },
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

    if (latestMessage?.role === 'user' && chat.status === 'idle') {
      if (model()?.provider) {
        setStore('chats', (c) => c.id === chat.id, 'status', 'loading');
        append({ chatId: chat.id, streamFn });
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
