import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test';

import { imageAttachment } from '~/store/examples';
import type { MessageProps } from '~/types';
import * as util from '~/util';

const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([]));
const { formatMessages } = await import('./util');
const { imageCache } = await import('./image-cache');
fetchMock.mockRestore();

afterEach(() => {
  mock.restore();
});

describe('formatMessages', () => {
  it('loads and encodes the Vision example image without using the attachment cache', async () => {
    const fetchImage = spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(new Blob(['image'], { type: 'image/jpeg' })),
    );
    const getImage = spyOn(imageCache, 'get').mockResolvedValue(null);
    const encodeImage = spyOn(util, 'base64EncodeFile').mockResolvedValue('aW1hZ2U=');
    const messages = imageAttachment.chats[0].messages;

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

    await expect(formatMessages(imageAttachment.chats[0].messages)).rejects.toThrow(
      'Failed to load image: food.jpg',
    );
  });
});
