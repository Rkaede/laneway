import { beforeEach, describe, expect, it, spyOn } from 'bun:test';

import type { MessageProps } from '~/types';

Object.defineProperty(globalThis, 'self', { value: globalThis, configurable: true });
const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(new Response('[]'));

const { setStore, store } = await import('../store');
const { addMessageToSessionChats, clearChatError } =
  await import('../store/actions/session-actions');
const { append, cancel } = await import('./chat-controller');
fetchMock.mockRestore();

const chatId = 'recovery-chat';
const sessionId = 'recovery-session';
const prompt: MessageProps = { id: 'prompt', role: 'user', content: 'Hello' };

function createStream(text: string) {
  return {
    fullStream: (async function* () {
      yield { type: 'text-delta' as const, text };
    })(),
    usage: Promise.resolve({ inputTokens: 1, outputTokens: 1, totalTokens: 2 }),
  };
}

beforeEach(() => {
  setStore('sessions', [
    { id: sessionId, title: 'Recovery', type: 'chat', created: 0, chats: [chatId] },
  ]);
  setStore('chats', [{ id: chatId, status: 'loading', messages: [prompt] }]);
});

describe('chat cancellation', () => {
  it.each(['Partial response', undefined])(
    'saves one canceled reply and clears the request (partial: %s)',
    async (content) => {
      const controller = new AbortController();
      setStore('chats', 0, {
        controller,
        latest: content ? { id: 'partial', role: 'assistant', content } : undefined,
      });

      await cancel({ chatId });
      await cancel({ chatId });

      expect(controller.signal.aborted).toBe(true);
      expect(store.chats[0].status).toBe('canceled');
      expect(store.chats[0].controller).toBeUndefined();
      expect(store.chats[0].latest).toBeUndefined();
      expect(store.chats[0].messages).toEqual([
        prompt,
        {
          id: expect.any(String),
          role: 'assistant',
          status: 'canceled',
          content: content ?? '',
          cancelled: true,
          usage: { created: expect.any(Number), timeTaken: 0 },
        },
      ]);
    },
  );

  it.each(['idle', 'error', 'canceled'] as const)(
    'leaves a %s chat unchanged when canceling a session',
    async (status) => {
      setStore('chats', 0, 'status', status);

      await cancel({ chatId });

      expect(store.chats[0]).toEqual({ id: chatId, status, messages: [prompt] });
    },
  );
});

describe('chat recovery', () => {
  it.each([undefined, null])(
    'ends loading with an unknown error when the stream rejects with %s',
    async (error) => {
      setStore('chats', 0, 'latest', { role: 'assistant', content: 'Partial response' });

      await append({
        chatId,
        streamFn: async () => {
          throw error;
        },
      });

      expect(store.chats[0].status).toBe('error');
      expect(store.chats[0].error).toEqual({ name: 'Unknown', message: 'Unknown' });
      expect(store.chats[0].controller).toBeUndefined();
      expect(store.chats[0].latest).toBeUndefined();
      expect(store.chats[0].messages).toEqual([prompt]);
    },
  );

  it('ends loading with an error when no stream is available', async () => {
    setStore('chats', 0, 'latest', { role: 'assistant', content: 'Partial response' });

    await append({ chatId, streamFn: async () => undefined });

    expect(store.chats[0].status).toBe('error');
    expect(store.chats[0].error?.message).toBe(
      'No provider is available for this model. Check your API keys in Settings.',
    );
    expect(store.chats[0].controller).toBeUndefined();
    expect(store.chats[0].latest).toBeUndefined();
    expect(store.chats[0].messages).toEqual([prompt]);
  });

  it('makes a failed prompt ready to send again when Retry clears the error', async () => {
    await append({
      chatId,
      streamFn: async () => {
        throw new Error('Request failed');
      },
    });

    expect(store.chats[0].status).toBe('error');
    expect(store.chats[0].error?.message).toBe('Request failed');

    clearChatError(chatId);

    expect(store.chats[0].status).toBe('idle');
    expect(store.chats[0].error).toBeUndefined();
    expect(store.chats[0].messages).toEqual([prompt]);

    await append({ chatId, streamFn: async () => createStream('Recovered') });

    expect(store.chats[0].status).toBe('idle');
    expect(store.chats[0].messages.at(-1)?.content).toBe('Recovered');
  });

  it.each(['error', 'canceled'] as const)(
    'makes a new prompt ready to send after %s',
    (status) => {
      setStore('chats', 0, {
        status,
        error: status === 'error' ? { name: 'Error', message: 'Request failed' } : undefined,
      });
      const nextPrompt: MessageProps = { id: 'next', role: 'user', content: 'Try again' };

      addMessageToSessionChats(nextPrompt, sessionId);

      expect(store.chats[0].messages).toEqual([prompt, nextPrompt]);
      expect(store.chats[0].status).toBe('idle');
      expect(store.chats[0].error).toBeUndefined();
    },
  );

  it('preserves loading status when a message is added during a request', () => {
    addMessageToSessionChats({ id: 'next', role: 'user', content: 'Next' }, sessionId);

    expect(store.chats[0].status).toBe('loading');
  });

  it.each(['error', 'finish', 'text'] as const)(
    'ignores an aborted stream that later produces %s while a new request is running',
    async (outcome) => {
      const started = Promise.withResolvers<void>();
      const stopped = Promise.withResolvers<void>();
      const stream = createStream('');
      stream.fullStream = (async function* () {
        yield { type: 'text-delta' as const, text: 'Partial' };
        started.resolve();
        await stopped.promise;
        if (outcome === 'error') throw undefined;
        if (outcome === 'text') yield { type: 'text-delta' as const, text: 'Late text' };
      })();

      const pending = append({ chatId, streamFn: async () => stream });
      await started.promise;
      await cancel({ chatId });

      expect(store.chats[0].status).toBe('canceled');
      expect(store.chats[0].controller).toBeUndefined();
      expect(store.chats[0].latest).toBeUndefined();
      expect(store.chats[0].messages.at(-1)?.content).toBe('Partial');
      expect(store.chats[0].messages.at(-1)?.cancelled).toBe(true);

      addMessageToSessionChats({ id: 'next', role: 'user', content: 'Next' }, sessionId);
      const nextController = new AbortController();
      setStore('chats', 0, {
        status: 'loading',
        controller: nextController,
        latest: { id: 'incoming', role: 'assistant', content: 'New response' },
      });
      const messages = [...store.chats[0].messages];

      stopped.resolve();
      await pending;

      expect(store.chats[0].status).toBe('loading');
      expect(store.chats[0].controller).toBe(nextController);
      expect(store.chats[0].latest?.content).toBe('New response');
      expect(store.chats[0].error).toBeUndefined();
      expect(store.chats[0].messages).toEqual(messages);
    },
  );
});
