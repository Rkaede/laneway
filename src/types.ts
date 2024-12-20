import type { Navigator, Params } from '@solidjs/router';
import type { Component, JSX } from 'solid-js';

export type TextPart = { type: 'text'; text: string };
export type ImagePart = { type: 'image'; image: { filename: string; storageId: string } };

export type MessageProps = {
  id: string;
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: Array<ImagePart | TextPart> | string;
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

export type ProviderId = 'openai' | 'google' | 'openrouter';

export type Provider = {
  id: ProviderId;
  modelId: string;
  primary?: boolean;
};

export type Creator = {
  id: string;
  name: string;
  website: string;
  icon: string;
  type?: 'frontier';
};

export type ModelProps = {
  id: string;
  provider: Provider[];
  description?: string;
  creator: Creator;
  created: number;
  icon?: string;
  tags: Array<ModelTags>;
  contextLength?: number;
  maxCompletionTokens?: number;
  title: string;
  vision?: boolean;
  maxFrequency?: number;
  maxTokens?: number;
  maxPenalty?: number;
  maxTemperature?: number;
  contextWindow?: number;
  pricing: {
    prompt: number;
    completion: number;
    image: number;
    request: number;
  };
  defaultSettings?: {
    temperature?: number;
    topP?: number;
    frequencyPenalty?: number;
    presencePenalty?: number;
  };
};

export enum Modality {
  TextImageText = 'text+image->text',
  TextText = 'text->text',
}

export interface Architecture {
  modality: Modality;
  tokenizer: string;
  instruct_type: null | string;
}

export type ModelTags = 'New' | 'Vision' | 'Free' | 'Online';

export type AssistantProps = {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  modelId: string;
  providerId?: string;
  templateId?: string;
  systemPrompt?: string;
  messages?: MessageProps[];
  profileImage?: string;
};

export type ChatProps = {
  id: string;
  messages: MessageProps[];
  created?: number;
  assistantId?: string;
  modelId?: string;
  error?: {
    name: string;
    message: string;
  };
  fetching?: boolean;
};

export type SessionType = 'chat' | 'note';

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
};

export type UserProps = {
  id: string;
  name: string;
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

export interface Action {
  id: string;
  name: string;
  keywords: string[];
  shortcut?: string;
  icon: Component;
  fn: (context: ActionContext, options?: Record<string, unknown>) => void;
}

export type Actions = {
  [key: string]: Action;
};

export type SessionTemplate = {
  type: 'model' | 'assistant' | 'preset';
  sessionType?: SessionType;
  id: string;
  // todo: check if title and modelId are needed
  title?: string;
  referenceId?: string;
};

export type SVGAttributes = Partial<JSX.SvgSVGAttributes<SVGSVGElement>>;

export type SpeedDialType = 'model' | 'assistant' | 'preset';

export type SpeedDialItem = {
  id: string;
  type?: SpeedDialType;
  referenceId?: string; // ID of the model, assistant, or preset
  title?: string; // Display name
  sessionType?: 'chat' | 'note';
};

export type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
