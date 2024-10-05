import { makePersisted } from '@solid-primitives/storage';
import { createStore } from 'solid-js/store';

import { imageCache } from '~/services/image-cache';
import type {
  AssistantProps,
  ChatProps,
  PresetProps,
  SessionProps,
  SessionTemplate,
  SpeedDialItem,
} from '~/types';

import { createSessionFromPreset } from './util';

const defaultPreset: PresetProps = {
  id: 'full-house',
  type: 'chat',
  presetTitle: 'Full House',
  presetDescription: 'Compare frontier models.',
  templateId: 'full-house',
  chats: [
    { modelId: 'openai/gpt-4o' },
    { modelId: 'anthropic/claude-3.5-sonnet' },
    { modelId: 'google/gemini-pro-1.5' },
  ],
};

interface State {
  sessions: SessionProps[];
  chats: ChatProps[];
  draftSession: SessionProps;
  draftChats: ChatProps[];
  assistants: AssistantProps[];
  presets: PresetProps[];
  speedDial: SpeedDialItem[];
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
    defaultSession: SessionTemplate;
    systemModel: string;
    noteModel: {
      referenceId: string;
      type: 'model' | 'assistant';
    };
    completions: {
      enabled: boolean;
      model: string;
    };
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
  const defaultPresetSession = createSessionFromPreset(defaultPreset);

  return {
    sessions: [],
    chats: [],
    draftSession: clone(defaultPresetSession.session),
    draftChats: clone(defaultPresetSession.chats),
    speedDial: [
      {
        id: 'full-house-dial',
        type: 'preset',
        referenceId: 'full-house',
        sessionType: 'chat',
        title: 'Compare frontier models',
      },
      {
        id: 'claude-3.5-sonnet-dial',
        type: 'model',
        referenceId: 'anthropic/claude-3.5-sonnet',
        sessionType: 'chat',
        title: 'Best of the vibecheck',
      },
      {
        id: 'o1-mini-dial',
        type: 'model',
        referenceId: 'openai/o1-mini',
        sessionType: 'note',
        title: 'Reasoning',
      },
    ],
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
      noteModel: {
        type: 'model',
        referenceId: 'openai/gpt-4o',
      },
      completions: {
        enabled: true,
        model: 'openai/gpt-4o',
      },
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
    presets: [...clone([defaultPreset])],
    assistants: [],
  };
}

// the warning given by the rule here is not helpful in this case
// eslint-disable-next-line solid/reactivity
export const [store, setStore] = makePersisted(createStore(createDefaultState()), {
  name: 'chat-store',
});

const defaults = createDefaultState();

// migrations
if (store.settings.messages === undefined) {
  setStore('settings', 'messages', defaults.settings.messages);
}

if (store.settings.messages.showAvatars === undefined) {
  setStore('settings', 'messages', 'showAvatars', defaults.settings.messages.showAvatars);
}

if (store.settings.messages.showModelTitle === undefined) {
  setStore('settings', 'messages', 'showModelTitle', defaults.settings.messages.showModelTitle);
}

if (store.settings.completions === undefined) {
  setStore('settings', 'completions', defaults.settings.completions);
}

if (store.speedDial === undefined) {
  setStore('speedDial', defaults.speedDial);
}

if (store.settings.noteModel === undefined) {
  setStore('settings', 'noteModel', defaults.settings.noteModel);
}

export const deleteData = () => {
  setStore(createDefaultState());
  imageCache.clearAll();
};
