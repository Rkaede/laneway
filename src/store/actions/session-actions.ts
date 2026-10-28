import { nanoid } from 'nanoid';
import { reconcile } from 'solid-js/store';

import { IconNewSession, IconTrash } from '~/components/icons/ui';
import { imageCache } from '~/services/image-cache';
import { completion, summarizeTitle } from '~/store/prompts';
import type {
  ActionContext,
  Actions,
  ChatProps,
  MessageProps,
  PresetProps,
  SessionProps,
  SessionType,
} from '~/types';

const router = import('~/services/llm');

import { getProvider } from '~/services/util';

import { setStore, store } from '..';
import { apiKeys } from '../keys';
import { models } from '../models';
import { createSessionFromPreset, getChatModel } from '../util';

export function addMessage(chatId: string, message: MessageProps) {
  const chatIndex = store.chats.findIndex((c) => c.id === chatId);
  if (chatIndex === -1) return;
  setStore('chats', chatIndex, 'messages', [...store.chats[chatIndex].messages, message]);
}

function createSessionFromDraft() {
  const sessionId = nanoid();
  const chats = store.draftChats.map((chat) => ({
    ...chat,
    id: nanoid(),
    created: Date.now(),
    sessionId,
    status: chat.status as 'idle' | 'error' | 'loading' | 'canceled',
  }));

  const session: SessionProps = {
    ...store.draftSession,
    id: sessionId,
    created: Date.now(),
    chats: chats.map((c) => c.id),
  };

  setStore('sessions', (otherSessions) => [session, ...otherSessions]);
  for (const chat of chats) {
    setStore('chats', store.chats.length, chat);
  }
  return session.id;
}

export function newDraftSession({
  sessionType = 'chat',
  type,
  referenceId,
}: {
  sessionType?: SessionType;
  type: 'model' | 'assistant' | 'preset';
  referenceId?: string;
}) {
  const chatId = nanoid();
  const record = () => {
    if (type === 'model') {
      return models.find((m) => m.id === referenceId);
    }
    if (type === 'assistant') {
      return store.assistants.find((a) => a.id === referenceId);
    }
    if (type === 'preset') {
      return store.presets.find((p) => p.id === referenceId);
    }
  };

  const _record = record();

  if (!_record) return;

  if (type === 'preset') {
    const draft = createSessionFromPreset(_record as PresetProps);
    setStore('draftSession', reconcile({ input: '', ...draft.session }));
    setStore('draftChats', draft.chats);
    return;
  }

  setStore(
    'draftSession',
    reconcile({
      id: nanoid(),
      title: sessionType === 'note' ? 'Untitled Note' : 'Untitled Chat',
      type: sessionType,
      chats: [chatId],
      created: Date.now(),
      input: '',
    }),
  );

  setStore('draftChats', [
    {
      id: chatId,
      status: 'idle',
      created: Date.now(),
      messages: [],
      modelId: type === 'model' ? referenceId : undefined,
      assistantId: type === 'assistant' ? referenceId : undefined,
    },
  ]);
}

export function addMessageToSessionChats(
  message: MessageProps,
  inputSessionId?: string,
  sessionType?: 'chat' | 'note',
) {
  const sessionId = inputSessionId ?? createSessionFromDraft();
  const session = store.sessions.find((s) => s.id === sessionId);
  if (session?.created === -1) return sessionId;

  if (session) {
    for (const chatId of session.chats) {
      const chat = store.chats.find((c) => c.id === chatId);
      const model = getChatModel(chat, store.assistants, models);

      const hasImageContent =
        Array.isArray(message.content) && message.content.some((part) => part.type === 'image');
      const supportsVision = model?.vision === true;

      if (!hasImageContent || supportsVision) {
        setStore(
          'chats',
          (c) => c.id === chatId,
          (c): Partial<ChatProps> => ({
            messages: sessionType === 'note' ? [message] : [...c.messages, message],
            status: c.status === 'loading' ? 'loading' : 'idle',
            error: undefined,
          }),
        );
      }
    }
  }
  return sessionId;
}

export function chatError(chatId: string, error: { name: string; message: string }) {
  setStore('chats', (c) => c.id === chatId, 'error', error);
}

export function clearChatError(chatId: string) {
  setStore('chats', (c) => c.id === chatId, {
    error: undefined,
    status: 'idle',
  });
}

export function setAssistant(id: string, chatId: string) {
  setStore('chats', (c) => c.id === chatId, 'assistantId', id);
}

export function setSessionInput(input: string, sessionId?: string) {
  if (!sessionId) {
    setStore('draftSession', 'input', input);
    return;
  }
  setStore('sessions', (s) => s.id === sessionId, 'input', input);
}

function deleteImagesForSession(sessionId: string) {
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return;

  session.chats.forEach((chatId) => deleteImagesForChat(chatId));
}

function deleteImagesForChat(chatId: string) {
  const chat = store.chats.find((c) => c.id === chatId);
  if (!chat) return;

  chat.messages.forEach((message) => {
    if (typeof message.content === 'string') return;
    message.content.forEach((content) => {
      if (content.type === 'image' && content.image.storageId) {
        imageCache.remove(content.image.storageId);
      }
    });
  });
}

export function deleteSession(sessionId: string) {
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return false;
  if (
    !window.confirm(
      `Delete "${session.title}" and all of its messages and images? This cannot be undone.`,
    )
  ) {
    return false;
  }

  for (const chatId of session.chats) {
    store.chats.find((c) => c.id === chatId)?.controller?.abort();
  }
  deleteImagesForSession(sessionId);

  setStore(
    'chats',
    store.chats.filter((c) => !session.chats.includes(c.id)),
  );
  setStore(
    'sessions',
    store.sessions.filter((s) => s.id !== sessionId),
  );
  return true;
}

export function renameSession(sessionId: string, title: string) {
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return;
  setStore('sessions', (s) => s.id === sessionId, 'title', title);
}

export async function autonameChat(sessionId: string, title: string) {
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return;
  const originalTitle = session.title;

  try {
    const provider = getProvider(store.settings.systemModel);
    if (!provider || !apiKeys[provider.id]?.trim()) return;

    const prompt = summarizeTitle.replace('{{messages}}', () => title);
    const llm = await router;
    const response = await llm.getText({
      messages: [{ id: nanoid(), role: 'user', content: [{ type: 'text', text: prompt }] }],
      modelId: provider.modelId,
      provider: provider.id,
    });
    if (!response) return;

    const formatted = response.text.replace(/^[\s#"'“‘`*_]+|[\s."'”’`*_]+$/g, '');
    if (!formatted) return;

    setStore(
      'sessions',
      (s) => s.id === sessionId && s.title === originalTitle,
      'title',
      formatted,
    );
  } catch (error) {
    console.error('Error generating session title:', error);
  }
}

export async function getCompletion(input: string) {
  const prompt = completion.replace('{{input}}', () => input);
  const llm = await router;
  const provider = getProvider(store.settings.completions.model);
  const response = await llm.getText({
    messages: [{ id: nanoid(), role: 'user', content: [{ type: 'text', text: prompt }] }],
    modelId: provider?.modelId,
    provider: provider?.id,
  });
  return response?.text;
}

export const sessionActions: Actions = {
  newSession: {
    id: 'new-session',
    name: 'New Session',
    keywords: ['new', 'session'],
    shortcut: 'c',
    icon: IconNewSession,
    fn: (
      context: ActionContext,
      options?: { referenceId?: string; type?: 'model' | 'assistant' | 'preset' },
    ) => {
      newDraftSession({
        sessionType: 'chat',
        referenceId: options?.referenceId ?? store.settings.defaultSession.id,
        type: options?.type ?? store.settings.defaultSession.type,
      });
      context.navigate('/');
    },
  },
  newNote: {
    id: 'new-note',
    name: 'New Note',
    keywords: ['new', 'note'],
    shortcut: 'n',
    icon: IconNewSession,
    fn: (
      context: ActionContext,
      options?: { referenceId?: string; type?: 'model' | 'assistant' | 'preset' },
    ) => {
      newDraftSession({
        sessionType: 'note',
        referenceId: options?.referenceId ?? store.settings.noteModel.referenceId,
        type: options?.type ?? store.settings.noteModel.type,
      });
      context.navigate('/');
    },
  },
  deleteSession: {
    id: 'delete-session',
    name: 'Delete Session',
    keywords: [],
    icon: IconTrash,
    available: ({ params }) => store.sessions.some((session) => session.id === params.id),
    fn: (context: ActionContext, options?: { sessionId?: string }) => {
      const sessionId = options?.sessionId ?? context.params.id;
      if (!sessionId) return;
      if (deleteSession(sessionId) && sessionId === context.params.id) {
        context.navigate('/');
      }
    },
  },
} as const;
