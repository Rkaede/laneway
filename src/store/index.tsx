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

const defaultPreset: PresetProps = {
  id: 'full-house',
  type: 'chat',
  presetTitle: 'Full House',
  presetDescription: 'Compare frontier models.',
  templateId: 'full-house',
  chats: [
    { modelId: 'openai/gpt-4o', status: 'idle' },
    { modelId: 'anthropic/claude-3.5-sonnet', status: 'idle' },
    { modelId: 'google/gemini-pro-1.5', status: 'idle' },
  ],
};

const reasoningDuet: PresetProps = {
  id: 'reasoning-duet',
  type: 'chat',
  presetTitle: 'Duet',
  presetDescription: 'The small reasoning models',
  templateId: 'reasoning-duet',
  chats: [
    {
      modelId: 'openai/o1-mini',
      status: 'idle',
    },
    {
      modelId: 'google/gemini-2.0-flash-exp:free',
      status: 'idle',
    },
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
    sessions: [],
    chats: [],
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
        id: 'full-house-dial',
        type: 'preset',
        referenceId: 'full-house',
        sessionType: 'chat',
        title: 'Compare frontier models',
      },
      {
        id: 'reasoning-duet-dial',
        type: 'preset',
        referenceId: 'reasoning-duet',
        sessionType: 'chat',
        title: 'Small reasoning models',
      },
      {
        id: 'claude-3.5-sonnet-dial',
        type: 'model',
        referenceId: 'anthropic/claude-3.5-sonnet',
        sessionType: 'chat',
        title: 'Best of the vibecheck',
      },
      {
        id: 'gpt-4o-mini-dial',
        type: 'model',
        referenceId: 'openai/gpt-4o-mini',
        sessionType: 'chat',
        title: 'Small & fast',
      },
      {
        id: 'sonar-70b-dial',
        type: 'model',
        referenceId: 'perplexity/llama-3.1-sonar-large-128k-online',
        sessionType: 'chat',
        title: 'Online model from perplexity',
      },
      {
        id: 'o1-preview-dial',
        type: 'model',
        referenceId: 'openai/o1-preview',
        sessionType: 'chat',
        title: 'Preview model from openai',
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
      systemModel: 'openai/gpt-4o',
      noteModel: {
        type: 'model',
        referenceId: 'openai/gpt-4o',
      },
      completions: {
        enabled: false,
        model: 'openai/gpt-4o',
      },
      defaultSession: {
        type: 'model',
        id: 'openai/gpt-4o',
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
    presets: [...clone([defaultPreset, reasoningDuet])],
    assistants: [],
  };
}

// the warning given by the rule here is not helpful in this case

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
