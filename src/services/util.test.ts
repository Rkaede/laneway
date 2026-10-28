import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';

import { imageAttachment } from '~/store/examples';
import type { MessageProps } from '~/types';
import * as util from '~/util';

const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([]));
const { setStore } = await import('~/store');
const { setApiKeys } = await import('~/store/keys');
const { setModels } = await import('~/store/models');
const { formatMessages, getProvider } = await import('./util');
const { imageCache } = await import('./image-cache');
fetchMock.mockRestore();

afterEach(() => {
  mock.restore();
});

describe('getProvider', () => {
  const primary = { id: 'openai', modelId: 'direct-model', primary: true } as const;
  const openrouter = { id: 'openrouter', modelId: 'openai/model', primary: false } as const;

  beforeEach(() => {
    setModels([
      {
        id: 'model',
        title: 'Model',
        creator: { id: 'openai', name: 'OpenAI', website: '', icon: '' },
        created: 0,
        provider: [openrouter, primary],
      },
    ]);
    setApiKeys({ openai: '', openrouter: '' });
    setStore('settings', 'openRouterUsage', 'fallback');
  });

  afterEach(() => {
    setModels([]);
    setApiKeys({ openai: '', openrouter: '' });
    setStore('settings', 'openRouterUsage', 'fallback');
  });

  it.each([
    { usage: 'fallback', directKey: true, routerKey: true, expected: primary },
    { usage: 'fallback', directKey: true, routerKey: false, expected: primary },
    { usage: 'fallback', directKey: false, routerKey: true, expected: openrouter },
    { usage: 'fallback', directKey: false, routerKey: false, expected: primary },
    { usage: 'always', directKey: true, routerKey: true, expected: openrouter },
    { usage: 'always', directKey: true, routerKey: false, expected: primary },
    { usage: 'always', directKey: false, routerKey: true, expected: openrouter },
    { usage: 'always', directKey: false, routerKey: false, expected: primary },
  ] as const)(
    'selects the provider in $usage mode (direct key: $directKey, router key: $routerKey)',
    ({ usage, directKey, routerKey, expected }) => {
      setStore('settings', 'openRouterUsage', usage);
      setApiKeys({
        openai: directKey ? 'direct-key' : '',
        openrouter: routerKey ? 'router-key' : '',
      });

      expect(getProvider('model')).toEqual(expected);
    },
  );

  it('returns no provider for an unknown model', () => {
    setApiKeys({ openai: 'direct-key', openrouter: 'router-key' });

    expect(getProvider('unknown')).toBeUndefined();
  });

  it.each(['always', 'fallback'] as const)(
    'returns no provider for a model without providers in %s mode',
    (usage) => {
      setStore('settings', 'openRouterUsage', usage);
      setApiKeys({ openai: 'direct-key', openrouter: 'router-key' });
      setModels(0, 'provider', []);

      expect(getProvider('model')).toBeUndefined();
    },
  );

  it.each(['always', 'fallback'] as const)(
    'requires a router key for a router-only model in %s mode',
    (usage) => {
      setStore('settings', 'openRouterUsage', usage);
      setModels(0, 'provider', [openrouter]);
      setApiKeys('openai', 'unrelated-key');

      expect(getProvider('model')).toBeUndefined();

      setApiKeys('openrouter', 'router-key');

      expect(getProvider('model')).toEqual(openrouter);
    },
  );

  it('keeps the primary provider when always mode has no router route', () => {
    setStore('settings', 'openRouterUsage', 'always');
    setModels(0, 'provider', [primary]);
    setApiKeys({ openai: 'direct-key', openrouter: 'router-key' });

    expect(getProvider('model')).toEqual(primary);
  });
});

describe('formatMessages', () => {
  it('loads and encodes the Vision example image without using the attachment cache', async () => {
    const fetchImage = spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(new Blob(['image'], { type: 'image/jpeg' })),
    );
    const getImage = spyOn(imageCache, 'get').mockResolvedValue(null);
    const encodeImage = spyOn(util, 'base64EncodeFile').mockResolvedValue('aW1hZ2U=');
    const messages = imageAttachment().chats[0].messages;

    const formatted = await formatMessages(messages);

    expect(fetchImage).toHaveBeenCalledWith('/examples/food.jpg');
    expect(getImage).not.toHaveBeenCalled();
    expect(formatted[0]).toEqual({
      role: 'user',
      content: [
        { type: 'image', image: 'aW1hZ2U=' },
        {
          type: 'text',
          text: 'Describe this dish, estimate its calories, and then give me a recipe.',
        },
      ],
    });
    expect(formatted[1] === messages[1]).toBe(true);
    const file = encodeImage.mock.calls[0][0];
    expect(file.name).toBe('food.jpg');
    expect(file.type).toBe('image/jpeg');
    expect(await file.text()).toBe('image');
  });

  it.each(['photo.png_123', '/photo.png_123'])(
    'loads uploaded image %s through the attachment cache',
    async (storageId) => {
      const fetchImage = spyOn(globalThis, 'fetch');
      const getImage = spyOn(imageCache, 'get').mockResolvedValue(
        new Blob(['image'], { type: 'image/png' }),
      );
      spyOn(util, 'base64EncodeFile').mockResolvedValue('aW1hZ2U=');
      const messages: MessageProps[] = [
        {
          id: 'prompt',
          role: 'user',
          content: [
            { type: 'image', image: { filename: 'photo.png', storageId } },
            { type: 'text', text: 'Describe this image.' },
          ],
        },
      ];

      const formatted = await formatMessages(messages);

      expect(getImage).toHaveBeenCalledWith(storageId);
      expect(fetchImage).not.toHaveBeenCalled();
      expect(formatted).toEqual([
        {
          role: 'user',
          content: [
            { type: 'image', image: 'aW1hZ2U=' },
            { type: 'text', text: 'Describe this image.' },
          ],
        },
      ]);
    },
  );

  it('rejects when the Vision example image cannot be loaded', async () => {
    spyOn(globalThis, 'fetch').mockResolvedValue(new Response('Not found', { status: 404 }));

    await expect(formatMessages(imageAttachment().chats[0].messages)).rejects.toThrow(
      'Failed to load image: food.jpg',
    );
  });
});
