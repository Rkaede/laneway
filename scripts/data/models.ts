import { existsSync, readFileSync } from 'fs';
import path from 'path';

import type { Architecture, ModelProps, ModelTags } from '../../src/types';
// models
import { anthropic } from './models/anthropic';
import { deepseek } from './models/deepseek';
import { google } from './models/google';
import { microsoft } from './models/microsoft';
import { openai } from './models/openai';
import { perplexity } from './models/perplexity';
import { xai } from './models/xai';

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
  xai: {
    creator: {
      name: 'xAI',
      website: 'https://x.ai/',
      icon: 'xAI',
      id: 'xai',
    },
    icon: 'xAI',
  },
} as const;

function mapBase(base: Array<Partial<ModelProps>>, defaultsKey: keyof typeof defaults) {
  return base.map((model) => {
    const provider = model.id
      ? [{ id: 'openrouter' as const, modelId: model.id, primary: false }]
      : [];

    return {
      ...defaults[defaultsKey],
      ...model,
      // This needs to go after we spread the model.
      // Otherwise the provider will be overwritten!
      provider: [...provider, ...(model.provider || [])],
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
  ...mapBase(xai, 'xai'),
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const routerModel = base.data.find((m: any) => m.id === model.id);
    if (!routerModel || routerModel.deprecated) {
      console.log('warning: model not on openrouter', model.id);
      return model;
    }

    const tags: Array<ModelTags> = [];
    const vision = routerModel.architecture?.modality === 'text+image->text';
    if (vision) {
      tags.push('vision');
    }

    // Check if the model is less than 3 months old
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
