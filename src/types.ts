import type { Navigator, Params } from '@solidjs/router';
import type { Component, JSX } from 'solid-js';

export type TextPart = { type: 'text'; text: string };
export type ImagePart = {
  type: 'image';
  image: {
    sourceType?: 'store' | 'path';
    filename: string;
    storageId: string;
  };
};

export type MessageProps = {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: Array<ImagePart | TextPart> | string;
  status?: 'idle' | 'loading' | 'error' | 'canceled';
  cancelled?: boolean;
  model?: ModelProps;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
    created?: number;
    timeTaken?: number;
  };
};

export type ProviderId = 'openrouter';

type Provider = {
  id: ProviderId;
  modelId: string;
};

/** A text-to-speech model on OpenRouter, written to public/speech-models.json at build time. */
export type SpeechModel = {
  id: string;
  title: string;
  voices: string[];
  /** US dollars per character of input. */
  price: number;
};

type Creator = {
  id: string;
  name: string;
  website: string;
  icon: string;
};

export type ModelProps = {
  id: string;
  provider: Provider[];
  description?: string;
  deprecated?: boolean;
  creator: Creator;
  created: number;
  icon?: string;
  tags?: Array<ModelTags>;
  contextLength?: number;
  maxCompletionTokens?: number;
  title: string;
  legacy?: boolean; // the model has a newer version
  vision?: boolean;
  reasoning?: boolean;
  pricing?: {
    prompt: number;
    completion: number;
    image: number;
    request: number;
  };
};

export type ModelTags = 'new' | 'vision' | 'free' | 'online' | 'reasoning';

export type AssistantProps = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  modelId: string;
  templateId?: string;
  systemPrompt?: string;
  messages?: MessageProps[];
  profileImage?: string;
};

export type ChatProps = {
  id: string;
  messages: MessageProps[];
  latest?: MessageProps | undefined;
  status: 'idle' | 'loading' | 'error' | 'canceled';
  sessionId?: string;
  controller?: AbortController;
  created?: number;
  assistantId?: string;
  modelId?: string;
  error?: {
    name: string;
    message: string;
  };
};

export type SessionType = 'chat' | 'note';

/** Where a forked session came from. The title is a snapshot, kept after the parent is deleted. */
export type SessionBranch = {
  parentId: string;
  parentTitle: string;
  /** The message in the parent that the fork was made from. */
  messageId: string;
  /** The copy of that message in the fork. New messages in the fork follow it. */
  forkedMessageId: string;
};

export type SessionProps = {
  id: string;
  // the title of the session shown in the sidebar
  title: string;
  type: SessionType;
  // we keep the preset details to show in the UI even if the preset is later deleted
  presetTitle?: string;
  presetDescription?: string;
  templateId?: string;
  // timestamp
  created: number;
  chats: string[];
  input?: string;
  branch?: SessionBranch;
};

export type PresetProps = Omit<SessionProps, 'created' | 'chats' | 'title'> & {
  chats: Omit<ChatProps, 'created' | 'messages' | 'id'>[] & {
    messages?: MessageProps[];
  };
};

export type ActionContext = {
  navigate: Navigator;
  params: Params;
  event?: KeyboardEvent;
};

interface Action {
  id: string;
  name: string;
  keywords: string[];
  shortcut?: string;
  icon: Component;
  available?: (context: ActionContext) => boolean;
  fn: (context: ActionContext, options?: Record<string, unknown>) => void;
}

export type Actions = {
  [key: string]: Action;
};

export type SessionTemplate = {
  type: 'model' | 'assistant' | 'preset';
  sessionType?: SessionType;
  id: string;
  title?: string;
  referenceId?: string;
};

export type SVGAttributes = Partial<JSX.SvgSVGAttributes<SVGSVGElement>>;

type SpeedDialType = 'model' | 'assistant' | 'preset';

export type SpeedDialItem = {
  id: string;
  type?: SpeedDialType;
  referenceId?: string; // ID of the model, assistant, or preset
  title?: string; // Display name
  sessionType?: 'chat' | 'note';
};
