import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import * as solid from 'solid-js';

Object.defineProperty(globalThis, 'self', { value: globalThis, configurable: true });
const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([]));
const { setStore, store } = await import('../store');
const { setApiKeys } = await import('../store/keys');
const { setModels } = await import('../store/models');
const controller = await import('../services/chat-controller');
const { useChat } = await import('./use-chat');
fetchMock.mockRestore();

let runEffect: () => void;
const append = mock<typeof controller.append>(async () => {});
const prompt = { id: 'prompt', role: 'user' as const, content: 'Hello' };

beforeEach(() => {
  // Bun uses Solid's server build, so run the hook's client effect explicitly.
  spyOn(solid, 'createEffect').mockImplementation(((fn: () => void) => {
    runEffect = fn;
  }) as typeof solid.createEffect);
  spyOn(controller, 'append').mockImplementation(append);
  append.mockClear();
  setApiKeys({ openrouter: '' });
  setStore('chats', [{ id: 'chat', modelId: 'model', status: 'idle', messages: [prompt] }]);
});

afterEach(() => {
  setApiKeys({ openrouter: '' });
  mock.restore();
});

describe('chat API keys', () => {
  it('dispatches an explicit request for the current chat without a message argument', async () => {
    const chat = useChat({ chat: store.chats[0] });

    await chat.append();

    expect(append).toHaveBeenCalledTimes(1);
    expect(append).toHaveBeenCalledWith({ chatId: 'chat', streamFn: expect.any(Function) });
    expect(store.chats[0].messages).toEqual([prompt]);
  });

  it('does not send read-only chats even when a key is configured', async () => {
    setModels([
      {
        id: 'model',
        title: 'Model',
        creator: { id: 'c', name: 'c', website: '', icon: '' },
        created: 0,
        provider: [{ id: 'openrouter', modelId: 'provider-model' }],
      },
    ]);
    setApiKeys('openrouter', 'test-key');
    const chat = useChat({ chat: store.chats[0], readOnly: () => true });

    runEffect();
    await chat.append();

    expect(chat.isApiKeyConfigured()).toBe(true);
    expect(append).not.toHaveBeenCalled();
    expect(store.chats[0].status).toBe('idle');
    expect(store.chats[0].messages).toEqual([prompt]);
  });

  it('waits for an OpenRouter key before starting a request', () => {
    setModels([
      {
        id: 'model',
        title: 'Model',
        creator: { id: 'c', name: 'c', website: '', icon: '' },
        created: 0,
        provider: [{ id: 'openrouter', modelId: 'provider-model' }],
      },
    ]);
    const chat = useChat({ chat: store.chats[0] });

    for (const key of [undefined, '', '   ']) {
      setApiKeys('openrouter', key);
      runEffect();

      expect(chat.isApiKeyConfigured()).toBe(false);
      expect(append).not.toHaveBeenCalled();
      expect(store.chats[0].status).toBe('idle');
      expect(store.chats[0].messages).toEqual([prompt]);
      expect(store.chats[0].error).toBeUndefined();
    }

    setApiKeys('openrouter', 'test-key');
    runEffect();

    expect(chat.isApiKeyConfigured()).toBe(true);
    expect(append).toHaveBeenCalledTimes(1);
    expect(append).toHaveBeenCalledWith({ chatId: 'chat', streamFn: expect.any(Function) });
    expect(store.chats[0].status).toBe('loading');
    expect(store.chats[0].messages).toEqual([prompt]);
  });
});

describe('assistant system prompt', () => {
  // Runs the real AI SDK against a stubbed OpenRouter, because the SDK decides whether a prompt
  // is valid before it sends anything.
  async function request(systemPrompt: string | undefined) {
    setModels([
      {
        id: 'model',
        title: 'Model',
        creator: { id: 'c', name: 'c', website: '', icon: '' },
        created: 0,
        provider: [{ id: 'openrouter', modelId: 'provider-model' }],
      },
    ]);
    setApiKeys('openrouter', 'test-key');
    setStore('assistants', [
      { id: 'assistant', title: 'Assistant', modelId: 'model', systemPrompt },
    ]);
    setStore('chats', 0, {
      assistantId: 'assistant',
      messages: [
        prompt,
        { id: 'reply', role: 'assistant', content: 'Hi there' },
        { id: 'follow-up', role: 'user', content: 'Tell me more' },
      ],
    });
    const chunk = {
      choices: [{ index: 0, finish_reason: 'stop', delta: { content: 'Sure' } }],
    };
    const openRouter = spyOn(globalThis, 'fetch').mockImplementation(
      (async () =>
        new Response(`data: ${JSON.stringify(chunk)}\n\ndata: [DONE]\n\n`, {
          headers: { 'content-type': 'text/event-stream' },
        })) as unknown as typeof fetch,
    );

    await useChat({ chat: store.chats[0] }).append();
    const { streamFn } = append.mock.calls[0][0];
    const stream = await streamFn(new AbortController().signal);
    let reply = '';
    for await (const part of stream!.fullStream) {
      if (part.type === 'error') throw part.error;
      if (part.type === 'text-delta') reply += part.text;
    }

    expect(reply).toBe('Sure');
    expect(openRouter).toHaveBeenCalledTimes(1);
    return JSON.parse(openRouter.mock.calls[0][1]?.body as string).messages;
  }

  const conversation = [
    { role: 'user', content: 'Hello' },
    { role: 'assistant', content: 'Hi there' },
    { role: 'user', content: 'Tell me more' },
  ];

  it('sends the system prompt as the first message, followed by the conversation', async () => {
    expect(await request('Answer in French.')).toEqual([
      { role: 'system', content: 'Answer in French.' },
      ...conversation,
    ]);
  });

  it.each([undefined, ''])(
    'sends only the conversation when the prompt is %p',
    async (empty) => {
      expect(await request(empty)).toEqual(conversation);
    },
  );
});
