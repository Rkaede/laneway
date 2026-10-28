import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';

import type { MessageProps } from '~/types';

// Store actions reference icons, which use Vite-only import aliases.
mock.module('~/components/icons/ui', () => ({
  IconNewSession: () => null,
  IconTrash: () => null,
}));

Object.defineProperty(globalThis, 'self', { value: globalThis, configurable: true });
const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([]));
const { setStore, store } = await import('..');
const { setApiKeys } = await import('../keys');
const { setModels } = await import('../models');
const {
  addMessageToSessionChats,
  autonameChat,
  getCompletion,
  newDraftSession,
  renameSession,
} = await import('./session-actions');
const llm = await import('~/services/llm');
fetchMock.mockRestore();

const imageMessage: MessageProps = {
  id: 'image-message',
  role: 'user',
  content: [
    { type: 'image', image: { filename: 'photo.png', storageId: 'photo' } },
    { type: 'text', text: 'What is in this picture?' },
  ],
};

beforeEach(() => {
  setModels(
    [true, false].map((vision) => ({
      id: vision ? 'vision' : 'no-vision',
      title: vision ? 'Vision Model' : 'No Vision Model',
      creator: { id: 'c', name: 'c', website: '', icon: '' },
      created: 0,
      provider: [],
      vision,
    })),
  );
  setStore('assistants', [
    { id: 'assistant-vision', title: 'Vision Assistant', modelId: 'vision' },
    { id: 'assistant-no-vision', title: 'No Vision Assistant', modelId: 'no-vision' },
  ]);
  setStore('sessions', [
    { id: 'session', title: 'Assistant chat', type: 'chat', created: 0, chats: ['chat'] },
  ]);
  setStore('chats', [
    { id: 'chat', assistantId: 'assistant-vision', status: 'idle', messages: [] },
  ]);
});

describe('newDraftSession', () => {
  it.each(['model', 'assistant'] as const)('titles %s drafts by session type', (type) => {
    const referenceId = type === 'model' ? 'vision' : 'assistant-vision';

    newDraftSession({ type, referenceId });

    expect(store.draftSession.type).toBe('chat');
    expect(store.draftSession.title).toBe('Untitled Chat');

    newDraftSession({ sessionType: 'note', type, referenceId });

    expect(store.draftSession.type).toBe('note');
    expect(store.draftSession.title).toBe('Untitled Note');
  });
});

describe('addMessageToSessionChats', () => {
  it('leaves example messages and request state unchanged', () => {
    const message: MessageProps = { id: 'example', role: 'assistant', content: 'Example' };
    const error = { name: 'Error', message: 'Previous error' };
    setStore('sessions', 0, 'created', -1);
    setStore('chats', 0, { messages: [message], status: 'error', error });

    const sessionId = addMessageToSessionChats(imageMessage, 'session');
    addMessageToSessionChats({ id: 'text', role: 'user', content: 'Hello' }, 'session');

    expect(sessionId).toBe('session');
    expect(store.chats[0].messages).toEqual([message]);
    expect(store.chats[0].status).toBe('error');
    expect(store.chats[0].error).toEqual(error);
  });

  it('adds image messages to a vision assistant chat', () => {
    addMessageToSessionChats(imageMessage, 'session');

    expect(store.chats[0].messages).toEqual([imageMessage]);
  });

  it('keeps image messages when creating a session from an assistant draft', () => {
    setStore('draftSession', {
      id: 'draft',
      title: 'Assistant draft',
      type: 'chat',
      created: 0,
      chats: ['draft-chat'],
    });
    setStore('draftChats', [
      { id: 'draft-chat', assistantId: 'assistant-vision', status: 'idle', messages: [] },
    ]);

    const sessionId = addMessageToSessionChats(imageMessage);
    const session = store.sessions.find((s) => s.id === sessionId);
    const chat = store.chats.find((c) => c.id === session?.chats[0]);

    expect(chat?.assistantId).toBe('assistant-vision');
    expect(chat?.modelId).toBeUndefined();
    expect(chat?.messages).toEqual([imageMessage]);
  });

  it('checks the assistant model before a model stored on the chat', () => {
    setStore('chats', 0, 'modelId', 'no-vision');

    addMessageToSessionChats(imageMessage, 'session');

    expect(store.chats[0].messages).toEqual([imageMessage]);
  });

  it('adds images only to vision-capable chats in a mixed session', () => {
    setStore('sessions', 0, 'chats', ['chat', 'model-chat', 'no-vision-chat']);
    setStore('chats', 1, { id: 'model-chat', modelId: 'vision', status: 'idle', messages: [] });
    setStore('chats', 2, {
      id: 'no-vision-chat',
      assistantId: 'assistant-no-vision',
      modelId: 'vision',
      status: 'idle',
      messages: [],
    });

    addMessageToSessionChats(imageMessage, 'session');

    expect(store.chats.map((c) => c.messages)).toEqual([[imageMessage], [imageMessage], []]);
  });

  it('still adds text messages to a non-vision assistant chat', () => {
    setStore('chats', 0, 'assistantId', 'assistant-no-vision');
    const message: MessageProps = { id: 'text-message', role: 'user', content: 'Hello' };

    addMessageToSessionChats(message, 'session');

    expect(store.chats[0].messages).toEqual([message]);
  });
});

function titleResponse(text: string) {
  return { text } as NonNullable<Awaited<ReturnType<typeof llm.getText>>>;
}

describe('autonameChat', () => {
  const getText = mock<typeof llm.getText>();

  beforeEach(() => {
    setModels(0, 'provider', [{ id: 'openai', modelId: 'title-model', primary: true }]);
    setStore('settings', 'systemModel', 'vision');
    setStore('settings', 'openRouterUsage', 'fallback');
    setApiKeys({ openai: 'test-key', openrouter: '' });
    getText.mockReset();
    getText.mockResolvedValue(titleResponse('Generated title'));
    spyOn(llm, 'getText').mockImplementation(getText);
    spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    setApiKeys({ openai: '', openrouter: '' });
    mock.restore();
  });

  it('preserves replacement patterns in the conversation snippet', async () => {
    const input = "Keep $$, $&, $`, $', $1 and $<name> literal.\n{{messages}}";

    await autonameChat('session', input);

    expect(getText.mock.calls[0][0].messages[0].content).toEqual([
      { type: 'text', text: expect.stringContaining(`>>>\n${input}\n>>>`) },
    ]);
  });

  it.each(['openai', 'openrouter'] as const)(
    'keeps the existing title without requesting a missing %s key',
    async (provider) => {
      setModels(0, 'provider', [{ id: provider, modelId: 'title-model', primary: true }]);
      setApiKeys(provider === 'openai' ? 'openrouter' : 'openai', 'unrelated-key');

      for (const key of [undefined, '', '   ']) {
        setApiKeys(provider, key);

        await expect(autonameChat('session', 'Hello')).resolves.toBeUndefined();

        expect(store.sessions[0].title).toBe('Assistant chat');
        expect(getText).not.toHaveBeenCalled();
      }
    },
  );

  it('skips generation when no provider is available', async () => {
    setStore('settings', 'systemModel', 'missing-model');

    await autonameChat('session', 'Hello');

    expect(store.sessions[0].title).toBe('Assistant chat');
    expect(getText).not.toHaveBeenCalled();
  });

  it.each([new Error('Missing API key'), new Error('Rate limit exceeded'), undefined])(
    'keeps the existing title when generation rejects with %s',
    async (error) => {
      getText.mockRejectedValueOnce(error);

      await expect(autonameChat('session', 'Hello')).resolves.toBeUndefined();

      expect(store.sessions[0].title).toBe('Assistant chat');
    },
  );

  it.each([
    ['  Planning trip.  ', 'Planning trip'],
    ['"Planning trip."', 'Planning trip'],
    ["'Planning trip.'", 'Planning trip'],
    ['“Planning trip.”', 'Planning trip'],
    ['‘Planning trip.’', 'Planning trip'],
    ['**Planning trip.**', 'Planning trip'],
    ['_Planning trip._', 'Planning trip'],
    ['`Planning trip.`', 'Planning trip'],
    ['### **"Planning trip."**', 'Planning trip'],
    ['***Planning trip.***', 'Planning trip'],
    ["Children's books.", "Children's books"],
    ['_snake_case_', 'snake_case'],
    ['`C#`', 'C#'],
  ])('cleans up %s', async (text, title) => {
    getText.mockResolvedValueOnce(titleResponse(text));

    await autonameChat('session', 'Hello');

    expect(store.sessions[0].title).toBe(title);
  });

  it.each(['', '   ', '### **"."**'])(
    'keeps the existing title when the generated title is empty (%s)',
    async (text) => {
      getText.mockResolvedValueOnce(titleResponse(text));

      await autonameChat('session', 'Hello');

      expect(store.sessions[0].title).toBe('Assistant chat');
    },
  );

  it('preserves a manual rename made while generation is pending', async () => {
    const started = Promise.withResolvers<void>();
    const response = Promise.withResolvers<ReturnType<typeof titleResponse>>();
    getText.mockImplementationOnce(() => {
      started.resolve();
      return response.promise;
    });

    const pending = autonameChat('session', 'Hello');
    await started.promise;
    renameSession('session', 'My title');
    response.resolve(titleResponse('Generated title'));
    await pending;

    expect(store.sessions[0].title).toBe('My title');
  });
});

describe('getCompletion', () => {
  afterEach(() => mock.restore());

  it('preserves replacement patterns in the current input', async () => {
    const input = "Keep $$, $&, $`, $', $1 and $<name> literal.\n{{input}}";
    const getText = spyOn(llm, 'getText').mockResolvedValue(titleResponse(' suggestion'));

    expect(await getCompletion(input)).toBe(' suggestion');

    expect(getText.mock.calls[0][0].messages[0].content).toEqual([
      {
        type: 'text',
        text: expect.stringContaining(`<current_input>\n${input}\n</current_input>`),
      },
    ]);
  });
});
