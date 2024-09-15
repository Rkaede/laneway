import { nanoid } from 'nanoid';

import {
  IconBox,
  IconFileSliders,
  IconInfo,
  IconLayoutGrid,
  IconListRestart,
  IconNewSession,
  IconSettings,
  IconSidebar,
  IconSun,
  IconTrash,
} from '~/components/icons/ui';
import * as router from '~/services/router';
import { summarizeTitle } from '~/store/prompts';
import type {
  ActionContext,
  Actions,
  DefaultSession,
  MessageProps,
  SessionProps,
} from '~/types';

import { setStore, store } from '.';
export * from './actions/assistants';

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

export function newDraftSessionWithModel(modelId: string) {
  const selectedModel = models.find((model) => model.id === modelId);

  if (selectedModel) {
    const chatId = nanoid();
    setStore('draftSession', {
      id: nanoid(),
      title: 'Untitled',
      presetTitle: undefined,
      presetDescription: undefined,
      chats: [chatId],
      created: Date.now(),
      input: '', // Explicitly set input to empty string
    });

    setStore('draftChats', [
      {
        id: chatId,
        created: Date.now(),
        modelId: selectedModel.id,
        messages: [],
      },
    ]);
  } else {
    console.warn(`Model with id ${modelId} not found`);
  }
}

export function newDraftSessionWithAssistant(assistantId: string) {
  const assistant = store.assistants.find((a) => a.id === assistantId);
  if (assistant) {
    const chatId = nanoid();
    setStore('draftSession', {
      id: nanoid(),
      title: 'Untitled',
      presetTitle: assistant.title,
      chats: [chatId],
      created: Date.now(),
      input: '', // Explicitly set input to empty string
    });

    setStore('draftChats', [
      {
        id: chatId,
        created: Date.now(),
        assistantId: assistant.id,
        messages: [],
      },
    ]);
  } else {
    console.warn(`Assistant with id ${assistantId} not found`);
  }
}

export function newDraftSessionWithPreset(presetId: string) {
  const preset = store.presets.find((p) => p.id === presetId);
  if (preset) {
    const draft = createSessionFromPreset(preset);
    setStore('draftSession', { input: '', ...draft.session }); // Ensure input is empty
    setStore('draftChats', draft.chats);
  } else {
    console.warn(`Preset with id ${presetId} not found`);
  }
}

export function addMessageToSessionChats(message: MessageProps, inputSessionId?: string) {
  const sessionId = inputSessionId ?? createSessionFromDraft();
  const session = store.sessions.find((s) => s.id === sessionId);

  if (session) {
    for (const chatId of session.chats) {
      setStore(
        'chats',
        (c) => c.id === chatId,
        'messages',
        (messages) => [...messages, message],
      );
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

export function resetDraft(template?: DefaultSession) {
  const config = template ?? store.settings.defaultSession;
  if (config.type === 'model') {
    newDraftSessionWithModel(config.id);
  } else if (config.type === 'assistant') {
    newDraftSessionWithAssistant(config.id);
  } else if (config.type === 'preset') {
    newDraftSessionWithPreset(config.id);
  } else {
    console.warn('Unknown session type', config);
  }
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

export function deleteSession(sessionId: string) {
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return;
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
  // get the session
  const session = store.sessions.find((s) => s.id === sessionId);
  if (!session) return;

  const prompt = summarizeTitle.replace('{{messages}}', title);
  const response = await router.getText({
    messages: [{ role: 'user', content: prompt }],
    modelId: store.settings.systemModel,
  });

  if (!response) return;

  // remove full stop from end if it exists
  const formatted = response.text.replace(/\.$/, '');

  setStore('sessions', (s) => s.id === sessionId, 'title', formatted);
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
    fn: (context: ActionContext, options?: { template?: DefaultSession }) => {
      resetDraft(options?.template);
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
} as const;
