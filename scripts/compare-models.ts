import { existsSync, readFileSync } from 'fs';
import path from 'path';

import { anthropic } from './data/models/anthropic';
import { deepseek } from './data/models/deepseek';
import { google } from './data/models/google';
import { microsoft } from './data/models/microsoft';
import { openai } from './data/models/openai';
import { perplexity } from './data/models/perplexity';
import { xai } from './data/models/xai';

const SUPPORTED_PROVIDERS = [
  'openai',
  'anthropic',
  'google',
  'microsoft',
  'perplexity',
  'deepseek',
  'x-ai',
] as const;

const FILTERED_MODELS: string[] = [
  'microsoft/phi-3-mini-128k-instruct',
  'microsoft/phi-3-medium-128k-instruct',
  'microsoft/wizardlm-2-8x22b',
  'microsoft/mai-ds-r1',
  'x-ai/grok-3',
  'x-ai/grok-3-beta',
  'x-ai/grok-3-mini-beta',
  'x-ai/grok-3-mini',
  'openai/o3',
  'openai/o4-mini',
  'openai/o4-mini-high',
  'openai/o1-pro',
  'openai/gpt-4o-mini-search-preview',
  'openai/gpt-4o-search-preview',
  'openai/codex-mini',
  'openai/o3-pro',
  'openai/o4-mini-deep-research',
  'openai/o3-deep-research',
  'openai/gpt-oss-120b:exacto',
  'openai/gpt-4o-audio-preview',
  'openai/gpt-oss-safeguard-20b',

  // Add model IDs here to exclude them from the comparison
  // Example: 'openai/gpt-3.5-turbo-0613',
];

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

function getConfiguredModelIds(): Set<string> {
  const allModels = [
    ...openai,
    ...anthropic,
    ...google,
    ...microsoft,
    ...perplexity,
    ...deepseek,
    ...xai,
  ];

  const modelIds = new Set<string>();
  for (const model of allModels) {
    if (model.id) {
      modelIds.add(model.id);
    }
  }

  return modelIds;
}

function getProviderFromModelId(modelId: string): string | null {
  for (const provider of SUPPORTED_PROVIDERS) {
    if (modelId.startsWith(`${provider}/`)) {
      return provider;
    }
  }
  return null;
}

async function findMissingModels() {
  const routerData = await fetchModels();
  const configuredIds = getConfiguredModelIds();

  // Calculate the date 12 months ago
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const twelveMonthsAgoTimestamp = Math.floor(twelveMonthsAgo.getTime() / 1000);

  const missingModels: Array<{
    id: string;
    name: string;
    provider: string;
    description?: string;
    created?: number;
  }> = [];

  for (const model of routerData.data || []) {
    const provider = getProviderFromModelId(model.id);
    if (!provider) {
      continue; // Skip models from unsupported providers
    }

    // Skip filtered models
    if (FILTERED_MODELS.includes(model.id)) {
      continue;
    }

    // Skip models older than 12 months
    if (model.created && model.created < twelveMonthsAgoTimestamp) {
      continue;
    }

    if (!configuredIds.has(model.id)) {
      missingModels.push({
        id: model.id,
        name: model.name || model.id,
        provider,
        description: model.description,
        created: model.created,
      });
    }
  }

  // Group by provider
  const grouped = missingModels.reduce(
    (acc, model) => {
      if (!acc[model.provider]) {
        acc[model.provider] = [];
      }
      acc[model.provider].push(model);
      return acc;
    },
    {} as Record<string, typeof missingModels>,
  );

  // Sort by created date (newest first)
  for (const provider in grouped) {
    grouped[provider].sort((a, b) => (b.created || 0) - (a.created || 0));
  }

  return grouped;
}

async function main() {
  try {
    console.log('Comparing OpenRouter models with configured models...\n');
    const missing = await findMissingModels();

    const totalMissing = Object.values(missing).reduce((sum, models) => sum + models.length, 0);

    if (totalMissing === 0) {
      console.log('✅ All models from supported providers are already configured!');
      return;
    }

    console.log(`Found ${totalMissing} missing models:\n`);

    for (const provider of SUPPORTED_PROVIDERS) {
      const models = missing[provider];
      if (!models || models.length === 0) {
        continue;
      }

      console.log(`\n📦 ${provider.toUpperCase()} (${models.length} missing):`);
      console.log('─'.repeat(60));

      for (const model of models) {
        const dateStr = model.created
          ? new Date(model.created * 1000).toISOString().split('T')[0]
          : 'unknown';
        console.log(`  • ${model.id}`);
        console.log(`    Name: ${model.name}`);
        if (model.description) {
          const desc =
            model.description.length > 80
              ? `${model.description.substring(0, 80)}...`
              : model.description;
          console.log(`    Description: ${desc}`);
        }
        console.log(`    Created: ${dateStr}`);
        console.log('');
      }
    }
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
