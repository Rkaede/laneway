import { makePersisted } from '@solid-primitives/storage';
import { createStore } from 'solid-js/store';

import { imageCache } from '~/services/image-cache';
import * as examples from '~/store/examples';
import type {
  AssistantProps,
  ChatProps,
  PresetProps,
  SessionProps,
  SessionTemplate,
  SpeedDialItem,
} from '~/types';

const defaultPreset: PresetProps = {
  id: 'daily-driver',
  type: 'chat',
  presetTitle: 'Daily Driver',
  presetDescription: 'Good enough',
  templateId: 'daily-driver',
  chats: [
    { modelId: 'openai/gpt-4.1', status: 'idle' },
    { modelId: 'anthropic/claude-3.7-sonnet', status: 'idle' },
    { modelId: 'google/gemini-2.5-pro-preview-03-25', status: 'idle' },
  ],
};

const flagshipModels: PresetProps = {
  id: 'flagship-models',
  type: 'chat',
  presetTitle: 'Flagship',
  presetDescription: 'Compare frontier models.',
  templateId: 'flagship-models',
  chats: [
    { modelId: 'openai/o3-mini-high', status: 'idle' },
    { modelId: 'anthropic/claude-3.7-sonnet:thinking', status: 'idle' },
    { modelId: 'google/gemini-2.5-pro-preview-03-25', status: 'idle' },
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
  featureFlags: {
    completions: boolean;
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
    tts: {
      enabled: boolean;
      service: string;
      openai: {
        voice: string;
      };
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
  return {
    sessions: [examples.story.session, examples.imageAttachment.session],
    chats: [...examples.story.chats, ...examples.imageAttachment.chats],
    draftSession: {
      id: 'draft',
      title: 'New Chat',
      type: 'chat',
      chats: ['draft-chat'],
      created: Date.now(),
    },
    draftChats: [
      {
        id: 'draft-chat',
        modelId: 'openai/gpt-4o',
        status: 'idle',
        messages: [],
      },
    ],
    speedDial: [
      {
        id: 'daily-driver-dial',
        type: 'preset',
        referenceId: 'daily-driver',
        sessionType: 'chat',
        title: 'Good enough',
      },
      {
        id: 'flagship-models-dial',
        type: 'preset',
        referenceId: 'flagship-models',
        sessionType: 'chat',
        title: 'Flagship models',
      },
      {
        id: 'claude-3.7-sonnet-dial',
        type: 'model',
        referenceId: 'anthropic/claude-3.7-sonnet',
        sessionType: 'chat',
        title: 'Best of the vibecheck',
      },
      {
        id: 'gpt-4.1-dial',
        type: 'model',
        referenceId: 'openai/gpt-4.1',
        sessionType: 'chat',
        title: 'Small & fast',
      },
      {
        id: 'sonar-reasoning-pro-dial',
        type: 'model',
        referenceId: 'perplexity/sonar-reasoning-pro',
        sessionType: 'chat',
        title: 'Online reasoning model',
      },
      {
        id: 'gemini-2.5-pro-preview-free-dial',
        type: 'model',
        referenceId: 'google/gemini-2.5-pro-exp-03-25:free',
        sessionType: 'chat',
        title: 'Gemini Pro 2.5 Preview',
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
    featureFlags: {
      completions: false,
    },
    settings: {
      systemModel: 'openai/gpt-4.1',
      noteModel: {
        type: 'model',
        referenceId: 'openai/gpt-4.1',
      },
      completions: {
        enabled: false,
        model: 'openai/gpt-4.1-nano',
      },
      defaultSession: {
        type: 'model',
        id: 'openai/gpt-4.1',
      },
      tts: {
        enabled: true,
        service: 'openai',
        openai: {
          voice: 'alloy',
        },
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
    presets: [...clone([defaultPreset, flagshipModels])],
    assistants: [],
  };
}

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

if (store.featureFlags === undefined) {
  setStore('featureFlags', defaults.featureFlags);
}

if (store.speedDial === undefined) {
  setStore('speedDial', defaults.speedDial);
}

if (store.settings.noteModel === undefined) {
  setStore('settings', 'noteModel', defaults.settings.noteModel);
}

if (store.settings.tts === undefined) {
  setStore('settings', 'tts', {
    enabled: true,
    service: 'openai',
    openai: {
      voice: 'alloy',
    },
  });
}

export const deleteData = () => {
  setStore(createDefaultState());
  imageCache.clearAll();
};
