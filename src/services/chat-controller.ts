// this controller is used as the middleman between the llm service and the store. this will always
// be running in the background and will allow navigation to other routes without interrupting
// the incoming message

import { nanoid } from 'nanoid';

import * as router from '~/services/llm';
import { setStore } from '~/store';
import { addMessage } from '~/store/actions';
import { selectChatById } from '~/store/selectors';

export async function cancel({ chatId }: { chatId: string }) {
  const chat = selectChatById(chatId)();
  if (!chat) return;

  chat.controller?.abort();

  addMessage(chat.id, {
    id: nanoid(),
    role: 'assistant',
    status: 'canceled',
    content: chat.latest?.content ?? '',
    cancelled: true,
    usage: {
      created: Date.now(),
      timeTaken: 0,
    },
  });

  setStore('chats', (c) => c.id === chatId, 'latest', undefined);
  setStore('chats', (c) => c.id === chatId, 'status', 'canceled');
}

export async function append({
  chatId,
  streamFn,
}: {
  chatId: string;
  streamFn: (abortSignal: AbortSignal) => ReturnType<typeof router.getStream>;
}) {
  const controller = new AbortController();
  try {
    const startTime = Date.now();
    setStore('chats', (c) => c.id === chatId, 'controller', controller);

    const stream = await streamFn(controller.signal);

    if (!stream) {
      throw new Error(
        'No provider is available for this model. Check your API keys in Settings.',
      );
    }
    let latestContent = '';

    // textStream hides API failures behind a generic NoOutputGeneratedError, fullStream carries them
    for await (const part of stream.fullStream) {
      if (controller.signal.aborted) return;
      if (part.type === 'error') throw part.error;
      if (part.type !== 'text-delta') continue;

      latestContent += part.text;

      setStore('chats', (c) => c.id === chatId, 'latest', {
        role: 'assistant',
        content: latestContent,
      });
    }

    const usage = await stream.usage;
    if (controller.signal.aborted) return;
    const timeTaken = Date.now() - startTime;

    addMessage(chatId, {
      id: nanoid(),
      role: 'assistant',
      content: latestContent,
      usage: {
        promptTokens: usage.inputTokens,
        completionTokens: usage.outputTokens,
        totalTokens: usage.totalTokens,
        created: Date.now(),
        timeTaken,
      },
    });
    setStore('chats', (c) => c.id === chatId, {
      controller: undefined,
      status: 'idle',
      latest: undefined,
    });
  } catch (error: unknown) {
    if (controller.signal.aborted) return;
    const errorMessage = (error as ErrorWithCode).message ?? 'Unknown';
    const errorName = (error as ErrorWithCode).code ?? 'Unknown';

    setStore('chats', (c) => c.id === chatId, {
      controller: undefined,
      latest: undefined,
      status: 'error',
      error: {
        name: errorName,
        message: errorMessage,
      },
    });
    // }
  }
}

type ErrorWithCode = Error & { code?: string };
