import { existsSync, readFileSync } from 'fs';
import path from 'path';

import type { Architecture, ModelProps, ModelTags } from '../../src/types';

const isDevelopment = process.env.NODE_ENV === 'development';


async function fetchModels() {

  // Local copy of the models from openrouter.
  // Used in offline development. 
  const modelsPath = path.resolve('./models.json');
  if (existsSync(modelsPath)) {
    console.info('Loading model data from local models.json.');
    try {
      const data = JSON.parse(readFileSync(modelsPath, 'utf-8'));
      return data;
    } catch (error) {
      console.error('Error reading local models.json:', error);
      throw error;
    }
  }

  console.info('Fetching model data from OpenRouter.');
  try {
    const response = await fetch('https://openrouter.ai/api/v1/models');
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching models:', error);
    throw error;
  }
}

export const providers = {
  openai: 'OpenAI',
  google: 'Google',
  openrouter: 'OpenRouter',
};

const defaults = {
  openai: {
    creator: { name: 'OpenAI', website: 'https://openai.com/', icon: 'OpenAI', id: 'openai' },
    icon: 'IconOpenAI',
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
    icon: 'Gemini',
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
  microsoft: {
    creator: {
      name: 'Microsoft',
      website: 'https://www.microsoft.com/research/',
      icon: 'Microsoft',
      id: 'microsoft',
    },
    icon: 'Microsoft',
  },
  deepseek: {
    creator: {
      name: 'DeepSeek',
      website: 'https://www.deepseek.com/',
      icon: 'DeepSeek',
      id: 'deepseek',
    },
    icon: 'DeepSeek',
  },
} as const;

const openai: Partial<ModelProps>[] = [
  {
    id: 'openai/gpt-3.5-turbo',
    title: 'GPT-3.5 Turbo',
    provider: [{ id: 'openai', modelId: 'gpt-3.5-turbo', primary: true }],
  },
  {
    id: 'openai/gpt-4-turbo',
    title: 'GPT-4 Turbo',
    provider: [{ id: 'openai', modelId: 'gpt-4-turbo', primary: true }],
  },
  {
    id: 'openai/gpt-4',
    title: 'GPT-4',
    provider: [{ id: 'openai', modelId: 'gpt-4', primary: true }],
  },
  {
    id: 'openai/gpt-4o',
    title: 'GPT-4o',
    provider: [{ id: 'openai', modelId: 'gpt-4o', primary: true }],
  },
  {
    id: 'openai/gpt-4o-mini',
    title: 'GPT-4o-mini',
    provider: [{ id: 'openai', modelId: 'gpt-4o-mini', primary: true }],
  },
  {
    id: 'openai/o1-mini',
    title: 'o1-mini',
    reasoning: true,
    provider: [{ id: 'openai', modelId: 'o1-mini', primary: true }],
  },
  {
    id: 'openai/o1-preview',
    title: 'o1-preview',
    reasoning: true,
    provider: [{ id: 'openai', modelId: 'o1-preview', primary: true }],
  },
  {
    id: 'openai/o1',
    title: 'o1',
    reasoning: true,
    provider: [{ id: 'openai', modelId: 'o1', primary: true }],
  },
  {
    id: 'openai/gpt-4.5-preview',
    title: 'GPT-4.5 (Preview)',
    provider: [{ id: 'openai', modelId: 'gpt-4.5-preview', primary: true }],
  },

  {
    id: 'openai/o3-mini-high',
    title: 'o3 Mini High',
    reasoning: true,
  },
  {
    id: 'openai/o3-mini',
    title: 'o3 Mini',
    reasoning: true,
  },
  {
    id: 'openai/gpt-4.1',
    title: 'GPT-4.1',
    provider: [{ id: 'openai', modelId: 'gpt-4.1', primary: true }],
  },
  {
    id: 'openai/gpt-4.1-mini',
    title: 'GPT-4.1 Mini',
    provider: [{ id: 'openai', modelId: 'gpt-4.1-mini', primary: true }],
  },
  {
    id: 'openai/gpt-4.1-nano',
    title: 'GPT-4.1 Nano',
    provider: [{ id: 'openai', modelId: 'gpt-4.1-nano', primary: true }],
  },
];

const anthropic: Partial<ModelProps>[] = [
  { id: 'anthropic/claude-3-haiku', title: 'Claude 3 Haiku' },
  { id: 'anthropic/claude-3-opus', title: 'Claude 3 Opus' },
  { id: 'anthropic/claude-3-sonnet', title: 'Claude 3 Sonnet' },
  { id: 'anthropic/claude-3.5-sonnet', title: 'Claude 3.5 Sonnet' },
  { id: 'anthropic/claude-3.7-sonnet', title: 'Claude 3.7 Sonnet' },
  {
    id: 'anthropic/claude-3.7-sonnet:thinking',
    title: 'Claude 3.7 Sonnet (thinking)',
    reasoning: true,
  },
];

const google: Partial<ModelProps>[] = [
  {
    id: 'google/gemini-2.5-pro-exp-03-25:free',
    title: 'Gemini Pro 2.5 Exp.',
    icon: 'GeminiPro',
    reasoning: true,
  },
  {
    id: 'google/gemini-pro-1.5',
    title: 'Gemini 1.5 Pro',
    provider: [{ id: 'google', modelId: 'models/gemini-1.5-pro-latest', primary: true }],
    icon: 'GeminiPro',
  },
  {
    id: 'google/gemini-flash-1.5',
    title: 'Gemini 1.5 Flash',
    provider: [{ id: 'google', modelId: 'models/gemini-1.5-flash-latest', primary: true }],
  },
  {
    id: 'google/gemini-2.0-flash-001',
    title: 'Gemini Flash 2.0',
  },
  {
    id: 'google/gemini-2.0-flash-lite-preview-02-05:free',
    title: 'Gemini Flash Lite 2.0 Preview (free)',
  },
  {
    id: 'google/gemini-2.0-flash-lite-001',
    title: 'Gemini 2.0 Flash Lite',
  },
  {
    id: 'google/gemini-2.5-pro-preview-03-25',
    title: 'Gemini Pro 2.5 Preview',
    icon: 'GeminiPro',
    reasoning: true,
  },
];

const deepseek = [
  { id: 'deepseek/deepseek-chat-v3-0324', title: 'DeepSeek: DeepSeek V3 0324' },
  { id: 'deepseek/deepseek-chat-v3-0324:free', title: 'DeepSeek: DeepSeek V3 0324 (free)' },
  { id: 'deepseek/deepseek-r1:free', title: 'DeepSeek R1 (free)', reasoning: true },
];

const microsoft = [
  { id: 'microsoft/phi-4', title: 'Phi 4' },
  { id: 'microsoft/phi-4-multimodal-instruct', title: 'Phi 4 Multimodal Instruct' },
];

const perplexity = [
  { id: 'perplexity/llama-3.1-sonar-large-128k-online', title: 'Sonar 70B' },
  { id: 'perplexity/sonar-reasoning-pro', title: 'Sonar Reasoning Pro', reasoning: true },
  { id: 'perplexity/sonar-pro', title: 'Sonar Pro' },
  { id: 'perplexity/sonar-deep-research', title: 'Sonar Deep Research', reasoning: true },
];

function mapBase(base: Array<Partial<ModelProps>>, defaultsKey: keyof typeof defaults) {
  return base.map((model) => {
    const provider = model.id
      ? [{ id: 'openrouter' as const, modelId: model.id, primary: true }]
      : [];

    return {
      ...defaults[defaultsKey],
      provider: [...provider, ...(model.provider || [])],
      ...model,
    };
  });
}

export const modelsBase: Partial<ModelProps>[] = [
  ...mapBase(openai, 'openai'),
  ...mapBase(anthropic, 'anthropic'),
  ...mapBase(google, 'google'),
  ...mapBase(microsoft, 'microsoft'),
  ...mapBase(perplexity, 'perplexity'),
  ...mapBase(deepseek, 'deepseek'),
];

if (isDevelopment) {
  modelsBase.push({
    id: 'aperture/glados',
    creator: {
      name: 'Aperture',
      website: 'https://half-life.fandom.com/wiki/Aperture_Science',
      icon: 'Aperture',
      id: 'aperture',
    },
    icon: 'Aperture',
    title: 'GLaDOS',
    provider: [{ id: 'openrouter', modelId: 'aperture/glados', primary: true }],
  });
}

export const generateModels = async () => {
  const base = await fetchModels();
  const results = modelsBase.map((model) => {
    if (model.id === 'aperture/glados') {
      return {
        ...model,
        architecture: {
          modality: 'text->text',
          tokenizer: 'standard-tokenizer',
          instruct_type: null,
        },
        created: 1011079824, // Feb 1, 2024
        description: 'AI assistant from Aperture Science.',
        contextLength: 16384,
        maxCompletionTokens: 4096,
        tags: ['new', 'free'],
        pricing: {
          prompt: 0,
          completion: 0,
          image: 0,
          request: 0,
        },
        vision: false,
      };
    }

    console.log(base);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const routerModel = base.data.find((m: any) => m.id === model.id);
    if (!routerModel) return model;

    const tags: Array<ModelTags> = [];
    const vision = routerModel.architecture?.modality === 'text+image->text';
    if (vision) {
      tags.push('vision');
    }

    // check if the model is less than 3 months old
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    if (new Date(routerModel.created * 1000) > twoMonthsAgo) {
      tags.push('new');
    }

    const online = routerModel.name.includes('Online');

    if (online) {
      tags.push('online');
    }

    // Add a 'Free' tag if the model is free
    if (
      Number(routerModel.pricing.prompt) === 0 &&
      Number(routerModel.pricing.completion) === 0 &&
      Number(routerModel.pricing.image) === 0 &&
      Number(routerModel.pricing.request) === 0
    ) {
      tags.push('free');
    }

    if (model.reasoning) {
      tags.push('reasoning');
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
  });
  return results;
};
