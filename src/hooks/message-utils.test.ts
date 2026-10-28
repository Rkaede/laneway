/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';

// Prevent fetch errors when importing modules that fetch data at load time
(globalThis as any).fetch = async () => Response.json([]);
(globalThis as any).self = {};

const { createMessage } = await import('./message-utils');
const { imageCache } = await import('../services/image-cache');
const { setModels } = await import('../store/models');
const { setStore, store } = await import('../store');

beforeEach(() => {
  spyOn(imageCache, 'add').mockResolvedValue(undefined);
  setModels([
    {
      id: 'vision',
      title: 'Vision Model',
      creator: { id: 'c', name: 'c', website: '', icon: '' },
      pricing: { prompt: 0, completion: 0, image: 0, request: 0 },
      created: 0,
      provider: [],
      vision: true,
    },
    {
      id: 'no-vision',
      title: 'No Vision Model',
      creator: { id: 'c', name: 'c', website: '', icon: '' },
      pricing: { prompt: 0, completion: 0, image: 0, request: 0 },
      created: 0,
      provider: [],
      vision: false,
    },
  ] as any);

  setStore('assistants', [
    { id: 'assistant-vision', title: 'Vision Assistant', modelId: 'vision' },
    { id: 'assistant-no-vision', title: 'No Vision Assistant', modelId: 'no-vision' },
  ]);
  setStore('draftChats', [
    { id: 'chat-vision', modelId: 'vision', status: 'idle', messages: [] },
    { id: 'chat-no-vision', modelId: 'no-vision', status: 'idle', messages: [] },
    {
      id: 'chat-assistant-vision',
      assistantId: 'assistant-vision',
      status: 'idle',
      messages: [],
    },
    {
      id: 'chat-assistant-no-vision',
      assistantId: 'assistant-no-vision',
      status: 'idle',
      messages: [],
    },
  ]);
  setStore('chats', [...store.draftChats]);
});

afterEach(() => mock.restore());

describe('createMessage', () => {
  it('returns undefined when a chat model lacks vision', async () => {
    const file = new File(['a'], 'a.png');
    const msg = await createMessage('hello', [file], {
      chatIds: ['chat-no-vision'],
      draft: true,
    });
    expect(msg).toBeUndefined();
  });

  it.each([true, false])(
    'rejects images without confirmed vision support (draft: %s)',
    async (draft) => {
      setModels(0, 'vision', undefined);

      for (const chatId of ['chat-vision', 'chat-assistant-vision']) {
        const msg = await createMessage('hello', [new File(['a'], 'a.png')], {
          chatIds: [chatId],
          draft,
        });

        expect(msg).toBeUndefined();
      }
    },
  );

  it('creates a message with image parts when vision is supported', async () => {
    const file = new File(['a'], 'a.png');
    const msg = await createMessage('hello', [file], {
      chatIds: ['chat-vision'],
      draft: true,
    });
    expect(msg).toBeDefined();
    expect(Array.isArray(msg!.content)).toBe(true);
  });

  it('uses unique URL-safe storage IDs while preserving attachment filenames', async () => {
    spyOn(Date, 'now').mockReturnValue(123);
    const addImage = spyOn(imageCache, 'add');
    const files = ['photo#1.png', 'photo?2.png', 'photo#1.png'].map(
      (name) => new File(['image'], name, { type: 'image/png' }),
    );

    const msg = await createMessage('hello', files, {
      chatIds: ['chat-vision'],
      draft: true,
    });

    const storageIds = addImage.mock.calls.map(([storageId]) => storageId);
    expect(storageIds).toHaveLength(files.length);
    expect(new Set(storageIds).size).toBe(files.length);
    for (const [index, storageId] of storageIds.entries()) {
      expect(storageId).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(addImage).toHaveBeenNthCalledWith(index + 1, storageId, files[index]);
    }
    expect(msg?.content).toEqual([
      ...files.map((file, index) => ({
        type: 'image' as const,
        image: { filename: file.name, storageId: storageIds[index] },
      })),
      { type: 'text', text: 'hello' },
    ]);
  });

  it.each([true, false])(
    'rejects images for a non-vision assistant (draft: %s)',
    async (draft) => {
      const msg = await createMessage('hello', [new File(['a'], 'a.png')], {
        chatIds: ['chat-assistant-no-vision'],
        draft,
      });

      expect(msg).toBeUndefined();
    },
  );

  it.each([true, false])(
    'creates image messages for a vision assistant (draft: %s)',
    async (draft) => {
      const msg = await createMessage('hello', [new File(['a'], 'a.png')], {
        chatIds: ['chat-assistant-vision'],
        draft,
      });

      expect(msg?.content).toEqual([
        { type: 'image', image: { filename: 'a.png', storageId: expect.any(String) } },
        { type: 'text', text: 'hello' },
      ]);
    },
  );

  it('checks the assistant model before a model stored on the chat', async () => {
    setStore('draftChats', (c) => c.id === 'chat-assistant-no-vision', 'modelId', 'vision');

    const msg = await createMessage('hello', [new File(['a'], 'a.png')], {
      chatIds: ['chat-assistant-no-vision'],
      draft: true,
    });

    expect(msg).toBeUndefined();
  });

  it.each([true, false])(
    'creates image messages for mixed sessions (draft: %s)',
    async (draft) => {
      for (const vision of [false, undefined]) {
        setModels(1, 'vision', vision);

        for (const chatIds of [
          ['chat-no-vision', 'chat-vision'],
          ['chat-vision', 'chat-assistant-no-vision'],
          ['chat-assistant-no-vision', 'chat-assistant-vision'],
          ['chat-assistant-vision', 'chat-no-vision'],
        ]) {
          const msg = await createMessage('hello', [new File(['a'], 'a.png')], {
            chatIds,
            draft,
          });

          expect(msg?.content).toEqual([
            { type: 'image', image: { filename: 'a.png', storageId: expect.any(String) } },
            { type: 'text', text: 'hello' },
          ]);
        }
      }
    },
  );

  it.each([true, false])(
    'rejects images when no target chat has confirmed vision support (draft: %s)',
    async (draft) => {
      setModels(0, 'vision', undefined);

      for (const chatIds of [
        [],
        ['chat-no-vision', 'chat-assistant-no-vision'],
        ['chat-no-vision', 'chat-assistant-vision'],
      ]) {
        const msg = await createMessage('hello', [new File(['a'], 'a.png')], {
          chatIds,
          draft,
        });

        expect(msg).toBeUndefined();
      }
    },
  );
});
