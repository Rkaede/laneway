import { makePersisted } from '@solid-primitives/storage';
import { createStore } from 'solid-js/store';

import { imageCache } from '~/services/image-cache';
import type {
  AssistantProps,
  ChatProps,
  DefaultSession,
  PresetProps,
  SessionProps,
} from '~/types';

import { assistants } from './library/assistants';
import { presets } from './library/presets';
import { createSessionFromPreset } from './util';

interface State {
  sessions: SessionProps[];
  chats: ChatProps[];
  draftSession: SessionProps;
  draftChats: ChatProps[];
  assistants: AssistantProps[];
  presets: PresetProps[];
  dialogs: {
    renameSession: {
      open: boolean;
      sessionId?: string;
    };
    about: {
      open: boolean;
    };
  };
  settings: {
    defaultSession: DefaultSession;
    systemModel: string;
    sidebarOpen: boolean;
    generateTitles: boolean;
    openRouterUsage: 'always' | 'fallback';
    theme: 'light' | 'dark';
    hasSeenWelcome: boolean;
    messages: {
      showAvatars: boolean;
      showModelTitle: boolean;
    };
  };
}

function clone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

// This needs to be a factory function. If we were to use just a variable it would be mutated by
// the store and resetStore would not work.
function createDefaultState(): State {
  const defaultPresets = ['full-house'];
  const defaultAssistants = ['gpt-4o-general-purpose', 'flashcards-gpt-4o'];
  const defaultPreset = createSessionFromPreset(
    presets.find((p) => p.id === 'full-house') ?? presets[0],
  );

  return {
    sessions: [],
    chats: [],
    draftSession: clone(defaultPreset.session),
    draftChats: clone(defaultPreset.chats),
    dialogs: {
      renameSession: {
        open: false,
        sessionId: undefined,
      },
      about: {
        open: false,
      },
    },
    settings: {
      systemModel: 'openai/gpt-4o',
      defaultSession: {
        type: 'preset',
        id: 'full-house',
      },
      openRouterUsage: 'fallback',
      sidebarOpen: true,
      generateTitles: true,
      theme: 'dark',
      hasSeenWelcome: false,
      messages: {
        showAvatars: false,
        showModelTitle: false,
      },
    },
    presets: [...clone(presets.filter((p) => defaultPresets.includes(p.id)))],
    assistants: [...clone(assistants.filter((a) => defaultAssistants.includes(a.id)))],
  };
}

// the warning given by the rule here is not helpful in this case
// eslint-disable-next-line solid/reactivity
export const [store, setStore] = makePersisted(createStore(createDefaultState()), {
  name: 'chat-store',
});

// migrations
if (store.settings.messages === undefined) {
  setStore('settings', 'messages', {});
}

if (store.settings.messages.showAvatars === undefined) {
  setStore('settings', 'messages', 'showAvatars', false);
}

if (store.settings.messages.showModelTitle === undefined) {
  setStore('settings', 'messages', 'showModelTitle', false);
}

export const deleteData = () => {
  setStore(createDefaultState());
  imageCache.clearAll();
};
