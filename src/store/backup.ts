import { nanoid } from 'nanoid';
import { createStore, reconcile, type SetStoreFunction } from 'solid-js/store';

import { imageCache } from '~/services/image-cache';
import type { ImagePart, MessageProps } from '~/types';
import { download, filenameDate } from '~/util';

import { deserializeChatStore, serializeChatStore } from './chat-persistence';
import { createDefaultState } from './default-state';
import { migrateStore } from './migrations';

type State = ReturnType<typeof createDefaultState>;
type Backup = { state: State; images: Map<string, Blob>; legacy: boolean };

function valid(condition: unknown): asserts condition {
  if (!condition) throw new Error('Invalid Laneway backup.');
}

function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function matchesShape(value: unknown, shape: unknown): boolean {
  if (shape === undefined) return true;
  if (Array.isArray(shape)) {
    return Array.isArray(value) && value.every((item) => matchesShape(item, shape[0]));
  }
  if (isObject(shape)) {
    return (
      isObject(value) &&
      Object.entries(shape).every(([key, item]) => matchesShape(value[key], item))
    );
  }
  return typeof value === typeof shape;
}

function validateMessage(message: unknown) {
  valid(isObject(message) && matchesShape(message, { id: '', role: '' }));
  valid(['user', 'assistant', 'system', 'tool'].includes(String(message.role)));
  if (typeof message.content === 'string') return;
  valid(Array.isArray(message.content));
  for (const part of message.content) {
    valid(isObject(part));
    if (part.type === 'text') valid(typeof part.text === 'string');
    else {
      valid(part.type === 'image' && isObject(part.image));
      valid(matchesShape(part.image, { filename: '', storageId: '' }));
      valid(
        part.image.sourceType === undefined ||
          part.image.sourceType === 'store' ||
          part.image.sourceType === 'path',
      );
    }
  }
}

function messageOwners(state: State): { messages?: MessageProps[]; latest?: MessageProps }[] {
  return [
    ...state.chats,
    ...state.draftChats,
    ...state.assistants,
    ...state.presets.flatMap((preset) => preset.chats),
  ];
}

function imageParts(state: State) {
  const messages = messageOwners(state).flatMap((owner) => [
    ...(owner.messages ?? []),
    ...(owner.latest ? [owner.latest] : []),
  ]);
  return messages.flatMap((message) =>
    typeof message.content === 'string'
      ? []
      : message.content.filter((part): part is ImagePart => part.type === 'image'),
  );
}

function imageKey(part: ImagePart) {
  return `${part.image.sourceType ?? 'store'}:${part.image.storageId}`;
}

export async function createBackup(state: State) {
  const snapshot = JSON.parse(serializeChatStore(state)) as State;
  const images: Record<string, { type: string; data: string }> = {};
  const visited = new Set<string>();
  let omittedImages = 0;
  for (const part of imageParts(snapshot)) {
    const key = imageKey(part);
    if (visited.has(key)) continue;
    visited.add(key);
    try {
      const blob =
        part.image.sourceType === 'path'
          ? await fetch(part.image.storageId).then((response) => {
              if (!response.ok) throw new Error(`Unable to read image: ${part.image.filename}`);
              return response.blob();
            })
          : await imageCache.get(part.image.storageId);
      if (!blob) throw new Error(`Image missing from storage: ${part.image.filename}`);
      const bytes = new Uint8Array(await blob.arrayBuffer());
      const chunks: string[] = [];
      for (let offset = 0; offset < bytes.length; offset += 0x8000) {
        chunks.push(String.fromCharCode(...bytes.subarray(offset, offset + 0x8000)));
      }
      images[key] = { type: blob.type, data: btoa(chunks.join('')) };
    } catch {
      omittedImages++;
    }
  }
  return {
    file: new Blob(
      [JSON.stringify({ format: 'laneway-backup', version: 1, state: snapshot, images })],
      { type: 'application/json' },
    ),
    omittedImages,
  };
}

export async function exportBackup(state: State) {
  const { file, omittedImages } = await createBackup(state);
  download(file, `laneway-backup-${filenameDate()}.json`);
  return omittedImages;
}

export function parseBackup(serialized: string): Backup {
  const data: unknown = JSON.parse(serialized);
  valid(isObject(data));
  const legacy = !('format' in data);
  if (!legacy && (data.format !== 'laneway-backup' || data.version !== 1)) {
    throw new Error('Unsupported backup format or version.');
  }
  const raw = legacy ? data : data.state;
  valid(isObject(raw));
  valid(raw.schemaVersion === undefined || raw.schemaVersion === 0 || raw.schemaVersion === 1);
  const sessionShape = { id: '', title: '', type: '', created: 0, chats: [''] };
  valid(
    matchesShape(raw, {
      sessions: [sessionShape],
      draftSession: sessionShape,
      chats: [{ id: '', status: '', messages: [] }],
      draftChats: [{ id: '', status: '', messages: [] }],
      assistants: [{ id: '', title: '', modelId: '' }],
      presets: [{ id: '', type: '', chats: [{ status: '' }] }],
      settings: {},
    }),
  );
  const state = deserializeChatStore(JSON.stringify(raw));
  for (const chat of [...state.chats, ...state.draftChats]) {
    valid(['idle', 'loading', 'error', 'canceled'].includes(chat.status));
  }
  for (const owner of messageOwners(state)) {
    if (owner.messages !== undefined) {
      valid(Array.isArray(owner.messages));
      owner.messages.forEach(validateMessage);
    }
    if (owner.latest !== undefined) validateMessage(owner.latest);
  }
  const [migrated, setMigrated] = createStore(state);
  migrateStore(migrated, setMigrated);
  const defaults = createDefaultState();
  valid(matchesShape(migrated.settings, defaults.settings));
  valid(matchesShape(migrated.featureFlags, defaults.featureFlags));
  valid(matchesShape(migrated.speedDial, [{ id: '' }]));
  state.dialogs = defaults.dialogs;

  const images = new Map<string, Blob>();
  if (!legacy) {
    valid(isObject(data.images));
    const keys = new Set(imageParts(state).map(imageKey));
    for (const [key, image] of Object.entries(data.images)) {
      valid(
        isObject(image) && typeof image.type === 'string' && typeof image.data === 'string',
      );
      const bytes = Uint8Array.from(atob(image.data), (character) => character.charCodeAt(0));
      if (keys.has(key)) images.set(key, new Blob([bytes], { type: image.type }));
    }
  }
  return { state, images, legacy };
}

export async function restoreBackup(
  backup: Backup,
  current: State,
  setState: SetStoreFunction<State>,
) {
  const state = deserializeChatStore(serializeChatStore(backup.state));
  const imported = new Map<string, string>();
  try {
    for (const [key, blob] of backup.images) {
      const storageId = nanoid();
      imported.set(key, storageId);
      await imageCache.add(storageId, blob);
    }
    for (const part of imageParts(state)) {
      const storageId = imported.get(imageKey(part));
      if (storageId) {
        part.image.storageId = storageId;
        part.image.sourceType = 'store';
      }
    }
  } catch (error) {
    await Promise.allSettled([...imported.values()].map((id) => imageCache.remove(id)));
    throw error;
  }
  for (const chat of [...current.chats, ...current.draftChats]) chat.controller?.abort();
  setState(reconcile(state));
}
