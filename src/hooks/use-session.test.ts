import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';

const navigate = mock(() => {});
mock.module('@solidjs/router', () => ({ useNavigate: () => navigate }));

// Store actions reference icons, which use Vite-only import aliases.
mock.module('~/components/icons/ui', () => ({
  IconBox: () => null,
  IconFileSliders: () => null,
  IconInfo: () => null,
  IconLayoutGrid: () => null,
  IconListRestart: () => null,
  IconNewSession: () => null,
  IconPencilLine: () => null,
  IconSettings: () => null,
  IconSidebar: () => null,
  IconSun: () => null,
  IconTrash: () => null,
}));

Object.defineProperty(globalThis, 'self', {
  value: globalThis,
  configurable: true,
  writable: true,
});
const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([]));
const { setStore, store } = await import('../store');
const { setModels } = await import('../store/models');
const { createSession } = await import('./use-session');
const { imageCache } = await import('../services/image-cache');
fetchMock.mockRestore();

const input = 'Please describe this image.';

beforeEach(() => {
  navigate.mockClear();
  setModels([
    {
      id: 'no-vision',
      title: 'No Vision Model',
      creator: { id: 'c', name: 'c', website: '', icon: '' },
      created: 0,
      provider: [],
      vision: false,
    },
  ]);
  setStore('settings', 'generateTitles', false);
  setStore('sessions', [
    { id: 'session', title: 'Chat', type: 'chat', created: 0, chats: ['chat'], input },
  ]);
  setStore('chats', [{ id: 'chat', modelId: 'no-vision', status: 'idle', messages: [] }]);
  setStore('draftSession', {
    id: 'draft',
    title: 'Draft',
    type: 'chat',
    created: 0,
    chats: ['draft-chat'],
    input,
  });
  setStore('draftChats', [
    { id: 'draft-chat', modelId: 'no-vision', status: 'idle', messages: [] },
  ]);
});

afterEach(() => {
  mock.restore();
});

describe('session submission', () => {
  it('allows submitting again after an empty input or a successful submission', async () => {
    setStore('sessions', 0, 'input', '');
    const session = createSession(() => 'session');
    await session.handleSubmit();

    session.handleInput(input);
    await session.handleSubmit();
    session.handleInput('Another message');
    await session.handleSubmit();

    expect(store.chats[0].messages.map((message) => message.content)).toEqual([
      input,
      'Another message',
    ]);
  });

  it.each([undefined, 'session'])(
    'ignores duplicate submissions while an image is being cached (session: %s)',
    async (sessionId) => {
      setModels(0, 'vision', true);
      const cached = Promise.withResolvers<void>();
      const cacheImage = spyOn(imageCache, 'add').mockReturnValue(cached.promise);
      const session = createSession(() => sessionId);
      session.handleFileSelect(new File(['image'], 'photo.png', { type: 'image/png' }));

      const pending = session.handleSubmit();
      const duplicate = session.handleSubmit();

      expect(store.chats[0].messages).toEqual([]);
      expect(store.sessions).toHaveLength(1);

      cached.resolve();
      await Promise.all([pending, duplicate]);

      const chat = sessionId ? store.chats[0] : store.chats[1];
      expect(chat.messages).toHaveLength(1);
      expect(cacheImage).toHaveBeenCalledTimes(1);
      expect(session.input).toBe('');
      expect(session.attachments).toEqual([]);
    },
  );

  it('allows retrying after an image cache write rejects', async () => {
    setModels(0, 'vision', true);
    const cacheImage = spyOn(imageCache, 'add')
      .mockRejectedValueOnce(new Error('Cache write failed'))
      .mockResolvedValue(undefined);
    const session = createSession(() => 'session');
    const file = new File(['image'], 'photo.png', { type: 'image/png' });
    session.handleFileSelect(file);

    await expect(session.handleSubmit()).rejects.toThrow('Cache write failed');

    expect(session.input).toBe(input);
    expect(session.attachments).toEqual([file]);
    await session.handleSubmit();

    expect(cacheImage).toHaveBeenCalledTimes(2);
    expect(store.chats[0].messages).toHaveLength(1);
    expect(session.input).toBe('');
    expect(session.attachments).toEqual([]);
  });

  it.each([
    [undefined, false],
    ['session', false],
    [undefined, undefined],
    ['session', undefined],
  ] as const)(
    'keeps text and attachments when an image is rejected (session: %s, vision: %s)',
    async (sessionId, vision) => {
      setModels(0, 'vision', vision);
      const session = createSession(() => sessionId);
      const file = new File(['image'], 'photo.png', { type: 'image/png' });
      session.handleFileSelect(file);

      await session.handleSubmit();

      expect(session.input).toBe(input);
      expect(session.attachments).toEqual([file]);
      expect(store.sessions).toHaveLength(1);
      expect(store.chats[0].messages).toEqual([]);
      expect(store.draftChats[0].messages).toEqual([]);
      expect(navigate).not.toHaveBeenCalled();
    },
  );

  it.each([undefined, 'session'])(
    'sends the retained text after removing a rejected image (session: %s)',
    async (sessionId) => {
      const session = createSession(() => sessionId);
      const file = new File(['image'], 'photo.png', { type: 'image/png' });
      session.handleFileSelect(file);
      await session.handleSubmit();

      session.handleRemoveFile(file);
      await session.handleSubmit();

      expect(session.input).toBe('');
      expect(session.attachments).toEqual([]);
      const chat = sessionId ? store.chats[0] : store.chats[1];
      expect(chat.messages).toEqual([{ id: expect.any(String), role: 'user', content: input }]);
    },
  );

  it('clears chat text and attachments after accepting an image', async () => {
    setModels(0, 'vision', true);
    const session = createSession(() => 'session');
    session.handleFileSelect(new File(['image'], 'photo.png', { type: 'image/png' }));

    await session.handleSubmit();

    expect(session.input).toBe('');
    expect(session.attachments).toEqual([]);
    expect(store.chats[0].messages[0].content).toEqual([
      { type: 'image', image: { filename: 'photo.png', storageId: expect.any(String) } },
      { type: 'text', text: input },
    ]);
  });

  it('keeps note text after a successful submission', async () => {
    setStore('sessions', 0, 'type', 'note');
    const session = createSession(() => 'session');

    await session.handleSubmit();

    expect(session.input).toBe(input);
    expect(store.chats[0].messages[0].content).toBe(input);
  });

  it.each(['idle', 'canceled'] as const)(
    'keeps a streaming note intact and allows submission after it becomes %s',
    async (status) => {
      const prompt = { id: 'prompt', role: 'user' as const, content: 'Original note' };
      const latest = { id: 'reply', role: 'assistant' as const, content: 'Partial reply' };
      const controller = new AbortController();
      setStore('sessions', 0, 'type', 'note');
      setStore('chats', 0, { status: 'loading', messages: [prompt], latest, controller });
      const session = createSession(() => 'session');

      await session.handleSubmit();

      expect(session.input).toBe(input);
      expect(store.chats[0].messages).toEqual([prompt]);
      expect(store.chats[0].latest).toEqual(latest);
      expect(store.chats[0].status).toBe('loading');
      expect(store.chats[0].controller).toBe(controller);
      expect(controller.signal.aborted).toBe(false);

      setStore('chats', 0, { status, latest: undefined, controller: undefined });
      await session.handleSubmit();

      expect(store.chats[0].messages).toEqual([
        { id: expect.any(String), role: 'user', content: input },
      ]);
      expect(store.chats[0].status).toBe('idle');
      expect(session.input).toBe(input);
    },
  );

  it('waits for every chat in a note before replacing its messages', async () => {
    const prompt = { id: 'prompt', role: 'user' as const, content: 'Original note' };
    setStore('sessions', 0, { type: 'note', chats: ['chat', 'streaming-chat'] });
    setStore('chats', 0, 'messages', [prompt]);
    setStore('chats', 1, {
      id: 'streaming-chat',
      modelId: 'no-vision',
      status: 'loading',
      messages: [prompt],
    });
    const session = createSession(() => 'session');

    await session.handleSubmit();

    expect(store.chats.map((chat) => chat.messages)).toEqual([[prompt], [prompt]]);
    expect(session.input).toBe(input);
  });
});
