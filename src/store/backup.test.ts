import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { createStore } from 'solid-js/store';

import { imageCache } from '~/services/image-cache';
import type { ImagePart, MessageProps } from '~/types';
import * as util from '~/util';

import { createBackup, exportBackup, parseBackup, restoreBackup } from './backup';
import { createDefaultState } from './default-state';

let images: Map<string, Blob>;

beforeEach(() => {
  images = new Map();
  spyOn(imageCache, 'get').mockImplementation(async (id) => images.get(id) ?? null);
  spyOn(imageCache, 'add').mockImplementation(async (id, blob) => {
    images.set(id, blob);
  });
  spyOn(imageCache, 'remove').mockImplementation(async (id) => {
    images.delete(id);
  });
});

afterEach(() => mock.restore());

function imageMessage(storageId: string, sourceType?: 'store' | 'path'): MessageProps {
  return {
    id: `message-${storageId}`,
    role: 'user',
    content: [
      { type: 'text', text: 'Describe this image' },
      { type: 'image', image: { filename: 'photo.png', storageId, sourceType } },
    ],
  };
}

function stateWithImages() {
  const state = createDefaultState();
  state.sessions = [
    { id: 'saved', title: 'Saved note', type: 'note', chats: ['chat'], created: 0 },
  ];
  state.chats = [{ id: 'chat', status: 'idle', messages: [imageMessage('photo')] }];
  state.draftChats[0].messages = [imageMessage('draft')];
  state.assistants = [
    { id: 'helper', title: 'Helper', modelId: 'model', messages: [imageMessage('photo')] },
  ];
  images.set('photo', new Blob([new Uint8Array([0, 127, 128, 255])], { type: 'image/png' }));
  images.set('draft', new Blob(['draft bytes'], { type: 'image/jpeg' }));
  return state;
}

function imagePart(message: MessageProps) {
  return (message.content as ImagePart[]).find((part) => part.type === 'image')!;
}

describe('backups', () => {
  it('round-trips data and deduplicated image bytes, including drafts and assistant messages', async () => {
    const source = stateWithImages();
    source.chats[0].latest = imageMessage('draft');
    const { file, omittedImages } = await createBackup(source);
    const serialized = JSON.parse(await file.text());
    expect(omittedImages).toBe(0);
    expect(file.type).toStartWith('application/json');
    expect(Object.keys(serialized.images)).toHaveLength(2);
    const backup = parseBackup(await file.text());
    images.clear();
    images.set('photo', new Blob(['existing image']));
    const [current, setCurrent] = createStore(createDefaultState());

    await restoreBackup(backup, current, setCurrent);

    expect(current.sessions).toEqual(source.sessions);
    expect(current.settings).toEqual(source.settings);
    expect(current.presets).toEqual(source.presets);
    const photo = imagePart(current.chats[0].messages[0]).image;
    const draft = imagePart(current.draftChats[0].messages[0]).image;
    expect(photo.storageId).not.toBe('photo');
    expect(photo.sourceType).toBe('store');
    expect(imagePart(current.assistants[0].messages![0]).image.storageId).toBe(photo.storageId);
    expect(imagePart(current.chats[0].latest!).image.storageId).toBe(draft.storageId);
    expect(new Uint8Array(await images.get(photo.storageId)!.arrayBuffer())).toEqual(
      new Uint8Array([0, 127, 128, 255]),
    );
    expect(images.get(photo.storageId)!.type).toBe('image/png');
    expect(await images.get(draft.storageId)!.text()).toBe('draft bytes');
    expect(await images.get('photo')!.text()).toBe('existing image');
    expect(imagePart(source.chats[0].messages[0]).image.storageId).toBe('photo');
  });

  it('includes path images so restored examples work without the original asset', async () => {
    const source = stateWithImages();
    source.chats[0].messages = [imageMessage('/examples/photo.png', 'path')];
    const fetchImage = spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(new Blob(['path image'], { type: 'image/png' })),
    );
    const { file } = await createBackup(source);
    expect(fetchImage).toHaveBeenCalledWith('/examples/photo.png');
    fetchImage.mockRejectedValue(new Error('Offline'));
    const [current, setCurrent] = createStore(createDefaultState());

    await restoreBackup(parseBackup(await file.text()), current, setCurrent);

    const restored = imagePart(current.chats[0].messages[0]).image;
    expect(restored.sourceType).toBe('store');
    expect(await images.get(restored.storageId)!.text()).toBe('path image');
  });

  it('includes images in preset messages', async () => {
    const source = stateWithImages();
    Object.assign(source.presets[0].chats[0], { messages: [imageMessage('preset')] });
    images.set('preset', new Blob(['preset image'], { type: 'image/png' }));
    const backup = parseBackup(await (await createBackup(source)).file.text());
    images.clear();
    const [current, setCurrent] = createStore(createDefaultState());

    await restoreBackup(backup, current, setCurrent);

    const messages = Reflect.get(current.presets[0].chats[0], 'messages') as MessageProps[];
    const restored = imagePart(messages[0]).image;
    expect(await images.get(restored.storageId)!.text()).toBe('preset image');
  });

  it('preserves partial text, cancels saved loading states, and aborts current requests on restore', async () => {
    const source = stateWithImages();
    const savedController = new AbortController();
    source.chats[0].controller = savedController;
    source.chats[0].status = 'loading';
    source.chats[0].latest = { id: 'partial', role: 'assistant', content: 'Partial answer' };
    const { file } = await createBackup(source);
    expect(await file.text()).not.toContain('controller');
    expect(savedController.signal.aborted).toBe(false);
    expect(source.chats[0].status).toBe('loading');
    const [current, setCurrent] = createStore(createDefaultState());
    const controller = new AbortController();
    const draftController = new AbortController();
    setCurrent('chats', 0, 'controller', controller);
    setCurrent('draftChats', 0, 'controller', draftController);

    await restoreBackup(parseBackup(await file.text()), current, setCurrent);

    expect(controller.signal.aborted).toBe(true);
    expect(draftController.signal.aborted).toBe(true);
    expect(current.chats[0].status).toBe('canceled');
    expect(current.chats[0].controller).toBeUndefined();
    expect(current.chats[0].latest?.content).toBe('Partial answer');
  });

  it('imports old JSON exports and runs migrations without inventing missing image bytes', async () => {
    const source = stateWithImages();
    const legacy = JSON.parse(JSON.stringify(source));
    delete legacy.schemaVersion;
    delete legacy.settings.theme;
    delete legacy.settings.messages;
    delete legacy.settings.noteModel;
    delete legacy.speedDial;
    const backup = parseBackup(JSON.stringify(legacy));
    expect(backup.legacy).toBe(true);
    expect(backup.images.size).toBe(0);
    const [current, setCurrent] = createStore(createDefaultState());

    await restoreBackup(backup, current, setCurrent);

    expect(current.schemaVersion).toBe(1);
    expect(current.settings.theme).toBe('system');
    expect(current.settings.messages).toEqual(createDefaultState().settings.messages);
    expect(current.sessions).toEqual(source.sessions);
    expect(imagePart(current.chats[0].messages[0]).image.storageId).toBe('photo');
    expect(imageCache.add).not.toHaveBeenCalled();
  });

  it('exports and restores data with missing images, reporting each omitted image once', async () => {
    const source = stateWithImages();
    images.delete('photo');

    const { file, omittedImages } = await createBackup(source);
    const data = JSON.parse(await file.text());

    expect(omittedImages).toBe(1);
    const savedState = JSON.parse(JSON.stringify(source));
    delete savedState.dialogs;
    expect(data.state).toEqual(savedState);
    expect(Object.keys(data.images)).toEqual(['store:draft']);
    const backup = parseBackup(await file.text());
    images.clear();
    const [current, setCurrent] = createStore(createDefaultState());

    await restoreBackup(backup, current, setCurrent);

    expect(current.sessions).toEqual(source.sessions);
    expect(current.chats[0].messages).toEqual(source.chats[0].messages);
    expect(current.assistants).toEqual(source.assistants);
    expect(images.has('photo')).toBe(false);
    const draft = imagePart(current.draftChats[0].messages[0]).image;
    expect(await images.get(draft.storageId)!.text()).toBe('draft bytes');
  });

  it('downloads the resilient backup and returns the omitted image count', async () => {
    const source = stateWithImages();
    images.delete('photo');
    const download = spyOn(util, 'download').mockImplementation(() => {});

    expect(await exportBackup(source)).toBe(1);

    expect(download).toHaveBeenCalledTimes(1);
    const [file, filename] = download.mock.calls[0];
    expect(file).toBeInstanceOf(Blob);
    expect(filename).toMatch(/^laneway-backup-.*\.json$/);
    expect(JSON.parse(await (file as Blob).text()).state.sessions).toEqual(source.sessions);
  });

  it('keeps exporting when image storage rejects a read', async () => {
    const source = stateWithImages();
    spyOn(imageCache, 'get').mockImplementation(async (id) => {
      if (id === 'photo') throw new Error('Storage blocked');
      return images.get(id) ?? null;
    });

    const { file, omittedImages } = await createBackup(source);

    expect(omittedImages).toBe(1);
    expect(Object.keys(JSON.parse(await file.text()).images)).toEqual(['store:draft']);
  });

  it.each(['HTTP error', 'network error'])(
    'keeps exporting and restoring when a path image cannot be fetched (%s)',
    async (failure) => {
      const source = stateWithImages();
      source.chats[0].messages = [imageMessage('/missing.png', 'path')];
      source.assistants[0].messages = [imageMessage('/missing.png', 'path')];
      const fetchImage = spyOn(globalThis, 'fetch');
      if (failure === 'HTTP error')
        fetchImage.mockResolvedValue(new Response(null, { status: 404 }));
      else fetchImage.mockRejectedValue(new Error('Offline'));

      const { file, omittedImages } = await createBackup(source);

      expect(omittedImages).toBe(1);
      expect(fetchImage).toHaveBeenCalledTimes(1);
      const backup = parseBackup(await file.text());
      const [current, setCurrent] = createStore(createDefaultState());
      await restoreBackup(backup, current, setCurrent);
      expect(current.chats[0].messages).toEqual(source.chats[0].messages);
      expect(current.assistants).toEqual(source.assistants);
    },
  );

  it('encodes multi-megabyte images without exceeding the argument limit or changing bytes', async () => {
    const source = stateWithImages();
    const bytes = new Uint8Array(2 * 1024 * 1024 + 3);
    for (let index = 0; index < bytes.length; index++) bytes[index] = index % 256;
    images.set('photo', new Blob([bytes], { type: 'image/png' }));

    const { file, omittedImages } = await createBackup(source);
    const backup = parseBackup(await file.text());

    expect(omittedImages).toBe(0);
    expect(new Uint8Array(await backup.images.get('store:photo')!.arrayBuffer())).toEqual(
      bytes,
    );
  });

  it('leaves current data, images, and requests intact if an image write fails', async () => {
    const source = stateWithImages();
    const backup = parseBackup(await (await createBackup(source)).file.text());
    const originalImages = new Map(images);
    let writes = 0;
    spyOn(imageCache, 'add').mockImplementation(async (id, blob) => {
      if (++writes === 2) throw new Error('Storage full');
      images.set(id, blob);
    });
    const [current, setCurrent] = createStore(createDefaultState());
    const controller = new AbortController();
    setCurrent('chats', 0, 'controller', controller);
    const before = JSON.stringify(current);

    await expect(restoreBackup(backup, current, setCurrent)).rejects.toThrow('Storage full');

    expect(JSON.stringify(current)).toBe(before);
    expect(controller.signal.aborted).toBe(false);
    expect(images).toEqual(originalImages);
  });

  it.each([
    'not JSON',
    'null',
    '{}',
    '[]',
    JSON.stringify({ format: 'other', version: 1 }),
    JSON.stringify({ format: 'laneway-backup', version: 2 }),
    JSON.stringify({ ...createDefaultState(), schemaVersion: 2 }),
    JSON.stringify({ ...createDefaultState(), chats: [null] }),
    JSON.stringify({ ...createDefaultState(), settings: { theme: 'dark' } }),
    JSON.stringify({
      ...createDefaultState(),
      draftChats: [
        {
          id: 'draft',
          status: 'idle',
          messages: [{ id: 'm', role: 'user', content: [{ type: 'image', image: {} }] }],
        },
      ],
    }),
  ])('rejects invalid or incompatible input before writing anything (%#)', (input) => {
    expect(() => parseBackup(input)).toThrow();
    expect(imageCache.add).not.toHaveBeenCalled();
  });

  it.each([
    null,
    {},
    { type: 'image/png', data: 1 },
    { type: 1, data: 'AA==' },
    { type: 'image/png', data: 'not base64!' },
  ])('rejects malformed present image entries before writing anything (%#)', async (image) => {
    const source = stateWithImages();
    const data = JSON.parse(await (await createBackup(source)).file.text());
    data.images['store:photo'] = image;

    expect(() => parseBackup(JSON.stringify(data))).toThrow();
    expect(imageCache.add).not.toHaveBeenCalled();
  });

  it('rejects malformed unreferenced image entries too', async () => {
    const source = stateWithImages();
    const data = JSON.parse(await (await createBackup(source)).file.text());
    data.images['store:unused'] = null;

    expect(() => parseBackup(JSON.stringify(data))).toThrow('Invalid Laneway backup');
    expect(imageCache.add).not.toHaveBeenCalled();
  });
});
