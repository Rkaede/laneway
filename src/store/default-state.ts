// Default state factory and constants
import type { Theme } from '~/constants';
import * as examples from '~/store/examples';
import type {
  AssistantProps,
  ChatProps,
  PresetProps,
  SessionProps,
  SessionTemplate,
  SpeedDialItem,
} from '~/types';
import { clone } from '~/util';

interface State {
  schemaVersion: number;
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
      /** An OpenRouter speech model id, from public/speech-models.json. */
      model: string;
      voice: string;
    };
    sidebarOpen: boolean;
    generateTitles: boolean;
    theme: Theme;
    hasSeenWelcome: boolean;
    messages: {
      showAvatars: boolean;
      showModelTitle: boolean;
    };
  };
}

const defaultPreset: PresetProps = {
  id: 'daily-driver',
  type: 'chat',
  presetTitle: 'Daily Driver',
  presetDescription: 'Good enough',
  templateId: 'daily-driver',
  chats: [
    { modelId: 'openai/gpt-6.1-terra', status: 'idle' },
    { modelId: 'anthropic/claude-sonnet-5.5', status: 'idle' },
    { modelId: 'google/gemini-3.8-flash', status: 'idle' },
  ],
};

const flagshipModels: PresetProps = {
  id: 'flagship-models',
  type: 'chat',
  presetTitle: 'Flagship',
  presetDescription: 'Compare frontier models.',
  templateId: 'flagship-models',
  chats: [
    { modelId: 'openai/gpt-6.1-sol', status: 'idle' },
    { modelId: 'anthropic/claude-opus-5.5', status: 'idle' },
    { modelId: 'google/gemini-4-argon', status: 'idle' },
  ],
};

const topShelf: PresetProps = {
  id: 'top-shelf',
  type: 'chat',
  presetTitle: 'Top Shelf',
  presetDescription: 'The best each lab makes. Priced like it.',
  templateId: 'top-shelf',
  chats: [
    { modelId: 'openai/gpt-6-astra', status: 'idle' },
    { modelId: 'anthropic/claude-fable-5.1', status: 'idle' },
    { modelId: 'google/gemini-4-argon', status: 'idle' },
  ],
};

// This needs to be a factory function. If we were to use just a variable it would be mutated by
// the store and resetStore would not work.
export function createDefaultState(): State {
  const story = examples.story();
  const imageAttachment = examples.imageAttachment();

  return {
    schemaVersion: 2,
    sessions: [story.session, imageAttachment.session],
    chats: [...story.chats, ...imageAttachment.chats],
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
        modelId: 'openai/gpt-6.1-terra',
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
        id: 'claude-sonnet-5.5-dial',
        type: 'model',
        referenceId: 'anthropic/claude-sonnet-5.5',
        sessionType: 'chat',
        title: 'Best of the vibecheck',
      },
      {
        id: 'gpt-6-luna-dial',
        type: 'model',
        referenceId: 'openai/gpt-6-luna',
        sessionType: 'chat',
        title: 'Small & fast',
      },
      {
        id: 'sonar-pro-search-dial',
        type: 'model',
        referenceId: 'perplexity/sonar-pro-search',
        sessionType: 'chat',
        title: 'Online search',
      },
      {
        id: 'gemini-4-argon-dial',
        type: 'model',
        referenceId: 'google/gemini-4-argon',
        sessionType: 'chat',
        title: "Google's flagship",
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
      systemModel: 'openai/gpt-6-luna',
      noteModel: {
        type: 'model',
        referenceId: 'openai/gpt-6.1-terra',
      },
      completions: {
        enabled: false,
        model: 'openai/gpt-6-luna',
      },
      defaultSession: {
        type: 'model',
        id: 'openai/gpt-6.1-terra',
      },
      tts: {
        enabled: true,
        model: 'hexgrad/kokoro-82m',
        voice: 'af_heart',
      },
      sidebarOpen: true,
      generateTitles: true,
      theme: 'system',
      hasSeenWelcome: false,
      messages: {
        showAvatars: false,
        showModelTitle: false,
      },
    },
    presets: [...clone([defaultPreset, flagshipModels, topShelf])],
    assistants: [],
  };
}

export const defaults = createDefaultState();
