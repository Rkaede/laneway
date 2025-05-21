import type { Accessor } from 'solid-js';
import { createMemo } from 'solid-js';

import { store } from './index';
import { apiKeys } from './keys';
import { models } from './models';

export const anyKeysSet = () => {
  return !!apiKeys?.openai || !!apiKeys?.google || !!apiKeys?.openrouter;
};

export const selectModelById = (id: string | Accessor<string | undefined>) => {
  return createMemo(() => {
    const _id = typeof id === 'function' ? id() : id;
    return models.find((m) => m.id === _id);
  });
};

export const selectSessionById = (id: string | Accessor<string | undefined>) => {
  return createMemo(() => {
    const _id = typeof id === 'function' ? id() : id;
    return store.sessions.find((s) => s.id === _id);
  });
};

export const selectChatById = (id: string | Accessor<string | undefined>) => {
  return createMemo(() => {
    const _id = typeof id === 'function' ? id() : id;
    return store.chats.find((c) => c.id === _id);
  });
};

export const selectAssistantById = (
  id: string | Accessor<string | undefined>,
) => {
  return createMemo(() => {
    const _id = typeof id === 'function' ? id() : id;
    return store.assistants.find((a) => a.id === _id);
  });
};

export const selectPresetById = (id: string | Accessor<string | undefined>) => {
  return createMemo(() => {
    const _id = typeof id === 'function' ? id() : id;
    return store.presets.find((p) => p.id === _id);
  });
};

export const selectDraftChatById = (
  id: string | Accessor<string | undefined>,
) => {
  return createMemo(() => {
    const _id = typeof id === 'function' ? id() : id;
    return store.draftChats.find((c) => c.id === _id);
  });
};
