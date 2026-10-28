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
const append = mock(async () => {});
const prompt = { id: 'prompt', role: 'user' as const, content: 'Hello' };

beforeEach(() => {
  // Bun uses Solid's server build, so run the hook's client effect explicitly.
  spyOn(solid, 'createEffect').mockImplementation(((fn: () => void) => {
    runEffect = fn;
  }) as typeof solid.createEffect);
  spyOn(controller, 'append').mockImplementation(append);
  append.mockClear();
  setApiKeys({ openai: '', openrouter: '' });
  setStore('settings', 'openRouterUsage', 'fallback');
  setStore('chats', [{ id: 'chat', modelId: 'model', status: 'idle', messages: [prompt] }]);
});

afterEach(() => {
  setApiKeys({ openai: '', openrouter: '' });
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
        provider: [{ id: 'openai', modelId: 'provider-model', primary: true }],
      },
    ]);
    setApiKeys('openai', 'test-key');
    const chat = useChat({ chat: store.chats[0], readOnly: () => true });

    runEffect();
    await chat.append();

    expect(chat.isApiKeyConfigured()).toBe(true);
    expect(append).not.toHaveBeenCalled();
    expect(store.chats[0].status).toBe('idle');
    expect(store.chats[0].messages).toEqual([prompt]);
  });

  it.each(['openai', 'openrouter'] as const)(
    'waits for a %s key before starting a request',
    (provider) => {
      setModels([
        {
          id: 'model',
          title: 'Model',
          creator: { id: 'c', name: 'c', website: '', icon: '' },
          created: 0,
          provider: [{ id: provider, modelId: 'provider-model', primary: true }],
        },
      ]);
      setApiKeys(provider === 'openai' ? 'openrouter' : 'openai', 'unrelated-key');
      const chat = useChat({ chat: store.chats[0] });

      for (const key of [undefined, '', '   ']) {
        setApiKeys(provider, key);
        runEffect();

        expect(chat.isApiKeyConfigured()).toBe(false);
        expect(append).not.toHaveBeenCalled();
        expect(store.chats[0].status).toBe('idle');
        expect(store.chats[0].messages).toEqual([prompt]);
        expect(store.chats[0].error).toBeUndefined();
      }

      setApiKeys(provider, 'test-key');
      runEffect();

      expect(chat.isApiKeyConfigured()).toBe(true);
      expect(append).toHaveBeenCalledTimes(1);
      expect(append).toHaveBeenCalledWith({ chatId: 'chat', streamFn: expect.any(Function) });
      expect(store.chats[0].status).toBe('loading');
      expect(store.chats[0].messages).toEqual([prompt]);
    },
  );
});
