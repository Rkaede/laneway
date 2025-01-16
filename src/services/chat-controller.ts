// this controller is used as the middleman between the llm service and the store. this will always
// be running in the background and will allow navigation to other routes without interrupting
// the incoming message

import { nanoid } from 'nanoid';

import * as router from '~/services/llm';
import { setStore, store } from '~/store';
import { addMessage } from '~/store/actions';

export async function cancel({ chatId }: { chatId: string }) {
  const chat = store.chats.find((c) => c.id === chatId);
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
  try {
    const startTime = Date.now();
    const controller = new AbortController();
    setStore('chats', (c) => c.id === chatId, 'controller', controller);

    const stream = await streamFn(controller.signal);

    if (!stream) return;
    let latestContent = '';

    for await (const textPart of stream.textStream) {
      latestContent += textPart;

      setStore('chats', (c) => c.id === chatId, 'latest', {
        role: 'assistant',
        content: latestContent,
      });
    }

    const usage = await stream.usage;
    const timeTaken = Date.now() - startTime;

    addMessage(chatId, {
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
    setStore('chats', (c) => c.id === chatId, {
      controller: undefined,
      status: 'idle',
      latest: undefined,
    });
  } catch (error) {
    if (error instanceof Error && error.name !== 'AbortError') {
      setStore('chats', (c) => c.id === chatId, {
        controller: undefined,
        latest: undefined,
        status: 'error',
        error: {
          name: error.name,
          message: error.message,
        },
      });
    }
  }
}
