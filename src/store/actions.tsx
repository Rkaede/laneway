import { nanoid } from 'nanoid';

import {
  IconBox,
  IconFileSliders,
  IconInfo,
  IconLayoutGrid,
  IconListRestart,
  IconNewSession,
  IconPencilLine,
  IconSettings,
  IconSidebar,
  IconSun,
  IconTrash,
} from '~/components/icons/ui';
import { imageCache } from '~/services/image-cache';
import { completion, summarizeTitle } from '~/store/prompts';
import type {
  ActionContext,
  Actions,
  MessageProps,
  PresetProps,
  SessionProps,
  SessionType,
} from '~/types';

const router = import('~/services/llm');

import { setStore, store } from '.';
export * from './actions/assistants';

import { getProvider } from '~/services/util';

import { models } from './models';
import { createSessionFromPreset } from './util';

export function addMessage(chatId: string, message: MessageProps) {
  const chatIndex = store.chats.findIndex((c) => c.id === chatId);
  if (chatIndex === -1) return;
  setStore('chats', chatIndex, 'messages', [...store.chats[chatIndex].messages, message]);
}

function createSessionFromDraft() {
  const chats = store.draftChats.map((chat) => ({
    ...chat,
    id: nanoid(),
    created: Date.now(),
  }));

  const session: SessionProps = {
    ...store.draftSession,
    id: nanoid(),
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
    setStore('draftSession', { input: '', ...draft.session }); // Ensure input is empty
    setStore('draftChats', draft.chats);
    return;
  }

  setStore('draftSession', {
    id: nanoid(),
    title: 'Untitled Note',
    type: sessionType,
    // todo: add presetTitle
    // presetTitle: undefined,
    chats: [chatId],
    created: Date.now(),
    input: '',
  });

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

  if (session) {
    for (const chatId of session.chats) {
      const chat = store.chats.find((c) => c.id === chatId);
      const model = models.find((m) => m.id === chat?.modelId);

      // Check if the message contains image content and if the model supports vision
      const hasImageContent =
        Array.isArray(message.content) && message.content.some((part) => part.type === 'image');
      const supportsVision = model?.vision === true;

      if (!hasImageContent || supportsVision) {
        setStore(
          'chats',
          (c) => c.id === chatId,
          'messages',
          (messages) => (sessionType === 'note' ? [message] : [...messages, message]),
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
  setStore('chats', (c) => c.id === chatId, 'error', undefined);
}

export function setAssistant(id: string, chatId: string) {
  setStore('chats', (c) => c.id === chatId, 'assistantId', id);
}

export function toggleSidebar() {
  setStore('settings', 'sidebarOpen', (open) => !open);
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
  if (!session) return;

  deleteImagesForSession(sessionId);

  setStore(
    'chats',
    store.chats.filter((c) => !session.chats.includes(c.id)),
  );
  setStore(
    'sessions',
    store.sessions.filter((s) => s.id !== sessionId),
  );
}

export function renameSession(sessionId: string, title: string) {
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return;
  setStore('sessions', (s) => s.id === sessionId, 'title', title);
}

export async function autonameChat(sessionId: string, title: string) {
  console.log('autonameChat', sessionId, title);

  // get the session
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return;

  const prompt = summarizeTitle.replace('{{messages}}', title);

  const provider = getProvider(store.settings.systemModel);

  const llm = await router;
  const response = await llm.getText({
    messages: [{ id: nanoid(), role: 'user', content: [{ type: 'text', text: prompt }] }],
    modelId: provider?.modelId,
    provider: provider?.id,
  });

  if (!response) return;

  // remove full stop from end if it exists
  const formatted = response.text.replace(/\.$/, '');

  setStore('sessions', (s) => s.id === sessionId, 'title', formatted);
}

export async function getCompletion(input: string) {
  const prompt = completion.replace('{{input}}', input);
  const llm = await router;
  const response = await llm.getText({
    messages: [{ id: nanoid(), role: 'user', content: [{ type: 'text', text: prompt }] }],
    modelId: store.settings.completions.model,
  });

  return response?.text;
}

export function showAboutDialog() {
  setStore('dialogs', 'about', 'open', true);
}

export const actions: Actions = {
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
  settings: {
    id: 'settings',
    name: 'Settings',
    keywords: ['settings'],
    icon: IconSettings,
    fn: (context: ActionContext) => {
      context.navigate('/settings');
    },
  },
  toggleSidebar: {
    id: 'toggle-sidebar',
    name: 'Toggle Sidebar',
    keywords: ['sidebar', 'toggle'],
    shortcut: '$mod+D',
    icon: IconSidebar,
    fn: () => toggleSidebar(),
  },
  editPresets: {
    id: 'edit-presets',
    name: 'Edit Presets',
    keywords: ['presets'],
    icon: IconLayoutGrid,
    fn: (context: ActionContext) => {
      context.navigate('/presets');
    },
  },
  editAssistants: {
    id: 'edit-assistants',
    name: 'Edit Assistants',
    keywords: [],
    icon: IconBox,
    fn: (context: ActionContext) => {
      context.navigate('/assistants');
    },
  },
  viewModels: {
    id: 'view-models',
    name: 'View Models',
    keywords: [],
    icon: IconFileSliders,
    fn: (context: ActionContext) => {
      context.navigate('/models');
    },
  },
  deleteSession: {
    id: 'delete-session',
    name: 'Delete Session',
    keywords: [],
    icon: IconTrash,
    fn: (context: ActionContext) => {
      deleteSession(context.params.id);
      context.navigate('/');
    },
  },
  gotoLatest: {
    id: 'goto-latest',
    name: 'Latest Session',
    keywords: ['navigate', 'latest'],
    icon: IconListRestart,
    fn: (context: ActionContext) => {
      if (store.sessions.length === 0) return;
      const latest = store.sessions.sort((a, b) => b.created - a.created)[0];
      context.navigate(`/session/${latest.id}`);
    },
  },
  toggleTheme: {
    id: 'toggle-theme',
    name: 'Toggle Theme',
    keywords: ['theme', 'dark', 'light', 'mode'],
    icon: IconSun,
    fn: () => {
      const newTheme = store.settings.theme === 'dark' ? 'light' : 'dark';
      setStore('settings', 'theme', newTheme);
    },
  },
  showAbout: {
    id: 'show-about',
    name: 'About',
    keywords: ['about', 'info', 'version'],
    icon: IconInfo,
    fn: () => showAboutDialog(),
  },
  toggleAvatars: {
    id: 'toggle-avatars',
    name: 'Toggle Message Avatars',
    keywords: ['avatars', 'show', 'hide'],
    icon: IconBox,
    fn: () => {
      setStore('settings', 'messages', 'showAvatars', (showAvatars) => !showAvatars);
    },
  },
  toggleCompletions: {
    id: 'toggle-completions',
    name: 'Toggle Completions',
    keywords: ['completions', 'show', 'hide'],
    icon: IconPencilLine,
    fn: () => {
      setStore('settings', 'completions', 'enabled', (enabled) => !enabled);
    },
  },
} as const;
