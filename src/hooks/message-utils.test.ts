/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it } from 'bun:test';

// Prevent fetch errors when importing modules that fetch data at load time
(globalThis as any).fetch = async () => ({ json: async () => [] });
(globalThis as any).self = {};

const { createMessage } = await import('./message-utils');
const { setModels } = await import('../store/models');
const { setStore } = await import('../store');

beforeEach(() => {
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

  setStore('draftChats', [
    { id: 'chat-vision', modelId: 'vision', status: 'idle', messages: [] },
    { id: 'chat-no-vision', modelId: 'no-vision', status: 'idle', messages: [] },
  ]);
});

describe('createMessage', () => {
  it('returns undefined when a chat model lacks vision', async () => {
    const file = new File(['a'], 'a.png');
    const msg = await createMessage('hello', [file], {
      chatIds: ['chat-no-vision'],
      draft: true,
    });
    expect(msg).toBeUndefined();
  });

  it('creates a message with image parts when vision is supported', async () => {
    const file = new File(['a'], 'a.png');
    const msg = await createMessage('hello', [file], {
      chatIds: ['chat-vision'],
      draft: true,
    });
    expect(msg).toBeDefined();
    expect(Array.isArray(msg!.content)).toBe(true);
  });
});
