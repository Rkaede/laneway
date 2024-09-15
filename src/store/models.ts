import base from '~/store/models.json' assert { type: 'json' };
import type { Architecture, ModelProps, ModelTags } from '~/types';

export const providers = {
  openai: 'OpenAI',
  google: 'Google',
  openrouter: 'OpenRouter',
};

const defaults = {
  openai: {
    creator: { name: 'OpenAI', website: 'https://openai.com/', icon: 'OpenAI', id: 'openai' },
    icon: 'IconOpenAI',
    maxFrequency: 2,
    maxPenalty: 2,
    maxTemperature: 2,
    maxTokens: 4096,
  },
  anthropic: {
    creator: {
      name: 'Anthropic',
      website: 'https://www.anthropic.com/',
      icon: 'Anthropic',
      id: 'anthropic',
    },
    icon: 'IconAnthropic',
  },
  google: {
    creator: { name: 'Google', website: 'https://ai.google/', icon: 'Google', id: 'google' },
    icon: 'IconGeminiPro',
  },
  perplexity: {
    creator: {
      name: 'Perplexity',
      website: 'https://www.perplexity.ai/',
      icon: 'Perplexity',
      id: 'perplexity',
    },
    icon: 'Perplexity',
  },
} as const;

const openai: Partial<ModelProps>[] = [
  {
    ...defaults.openai,
    id: 'openai/gpt-3.5-turbo',
    title: 'GPT-3.5 Turbo',
    provider: [
      { id: 'openai', modelId: 'gpt-3.5-turbo', primary: true },
      { id: 'openrouter', modelId: 'openai/gpt-3.5-turbo' },
    ],
    defaultSettings: {
      temperature: 0.7,
      topP: 1,
      frequencyPenalty: 0,
      presencePenalty: 0,
    },
  },
  {
    ...defaults.openai,
    id: 'openai/gpt-4-turbo',
    title: 'GPT-4 Turbo',
    provider: [
      { id: 'openai', modelId: 'gpt-4-turbo', primary: true },
      { id: 'openrouter', modelId: 'openai/gpt-4-turbo' },
    ],
  },
  {
    ...defaults.openai,
    id: 'openai/gpt-4',
    title: 'GPT-4',
    provider: [
      { id: 'openai', modelId: 'gpt-4', primary: true },
      { id: 'openrouter', modelId: 'openai/gpt-4' },
    ],
    contextWindow: 8192,
  },
  {
    ...defaults.openai,
    id: 'openai/gpt-4o',
    title: 'GPT-4o',
    provider: [
      { id: 'openai', modelId: 'gpt-4o', primary: true },
      { id: 'openrouter', modelId: 'openai/gpt-4o' },
    ],
    vision: true,
    contextWindow: 128000,
  },
];

const anthropic: Partial<ModelProps>[] = [
  {
    ...defaults.anthropic,
    id: 'anthropic/claude-3-haiku',
    title: 'Claude 3 Haiku',
    provider: [{ id: 'openrouter', modelId: 'anthropic/claude-3-haiku', primary: true }],
    vision: true,
  },
  {
    ...defaults.anthropic,
    id: 'anthropic/claude-3-opus',
    title: 'Claude 3 Opus',
    provider: [{ id: 'openrouter', modelId: 'anthropic/claude-3-opus', primary: true }],
    vision: true,
  },
  {
    ...defaults.anthropic,
    id: 'anthropic/claude-3-sonnet',
    title: 'Claude 3 Sonnet',
    provider: [{ id: 'openrouter', modelId: 'anthropic/claude-3-sonnet', primary: true }],
    vision: true,
  },
  {
    ...defaults.anthropic,
    id: 'anthropic/claude-3.5-sonnet',
    title: 'Claude 3.5 Sonnet',
    provider: [{ id: 'openrouter', modelId: 'anthropic/claude-3.5-sonnet', primary: true }],
    vision: true,
  },
];

const google: Partial<ModelProps>[] = [
  {
    ...defaults.google,
    id: 'google/gemini-pro-1.5',
    title: 'Gemini 1.5 Pro',
    provider: [
      { id: 'google', modelId: 'models/gemini-1.5-pro-latest', primary: true },
      { id: 'openrouter', modelId: 'google/gemini-pro-1.5' },
    ],
    icon: 'GeminiPro',
  },
  {
    ...defaults.google,
    id: 'google/gemini-flash-1.5',
    title: 'Gemini 1.5 Flash',
    provider: [
      { id: 'google', modelId: 'models/gemini-1.5-flash-latest', primary: true },
      { id: 'openrouter', modelId: 'google/gemini-flash-1.5' },
    ],
    icon: 'Gemini',
  },
];

const perplexity: Partial<ModelProps>[] = [
  {
    ...defaults.perplexity,
    id: 'perplexity/llama-3.1-sonar-huge-128k-online',
    title: 'Llama 3.1 Sonar 405B Online',
    provider: [
      {
        id: 'openrouter',
        modelId: 'perplexity/llama-3.1-sonar-huge-128k-online',
        primary: true,
      },
    ],
  },
];

export const modelsBase: Partial<ModelProps>[] = [
  ...openai,
  ...anthropic,
  ...google,
  ...perplexity,
];

export const models: ModelProps[] = modelsBase.map((model) => {
  const routerModel = base.data.find((m) => m.id === model.id);
  if (!routerModel) return model;

  const tags: Array<ModelTags> = [];
  const vision = routerModel.architecture?.modality === 'text+image->text';
  if (vision) {
    tags.push('Vision');
  }

  // check if the model is less than 3 months old
  const twoMonthsAgo = new Date();
  twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
  if (new Date(routerModel.created * 1000) > twoMonthsAgo) {
    tags.push('New');
  }

  const online = routerModel.name.includes('Online');

  if (online) {
    tags.push('Online');
  }

  // Add a 'Free' tag if the model is free
  if (
    Number(routerModel.pricing.prompt) === 0 &&
    Number(routerModel.pricing.completion) === 0 &&
    Number(routerModel.pricing.image) === 0 &&
    Number(routerModel.pricing.request) === 0
  ) {
    tags.push('Free');
  }

  const updated = {
    ...model,
    architecture: routerModel.architecture as Architecture,
    created: routerModel.created,
    description: routerModel.description,
    contextLength: routerModel.context_length,
    maxCompletionTokens: Number(routerModel.top_provider.max_completion_tokens),
    tags,
    pricing: {
      prompt: Number(routerModel.pricing.prompt),
      completion: Number(routerModel.pricing.completion),
      image: Number(routerModel.pricing.image),
      request: Number(routerModel.pricing.request),
    },

    vision,
  };
  return updated;
}) as ModelProps[];

export const modelsByCreator = models.reduce(
  (acc, model) => {
    const group = acc.find((g) => g.title === model.creator?.name);
    if (!group) {
      acc.push({ title: model.creator.name, models: [model] });
    } else {
      group.models.push(model);
    }
    return acc;
  },
  [] as { title: string; models: ModelProps[] }[],
);
