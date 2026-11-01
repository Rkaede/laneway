import { existsSync, readFileSync } from 'fs';
import path from 'path';

import type { SpeechModel } from '../../src/types';

// These only return raw PCM, which a browser cannot play without knowing its sample rate, and
// OpenRouter does not document it. Laneway asks for MP3.
const PCM_ONLY_PREFIXES = ['heygen/', 'google/'];

/** OpenRouter leaves speech models out of the default model list, so they are fetched apart. */
export async function fetchSpeechModels() {
  // Local copy for offline development, like models.json.
  const localPath = path.resolve('./speech-models.json');
  if (existsSync(localPath)) {
    console.info('Loading speech model data from local speech-models.json.');
    return JSON.parse(readFileSync(localPath, 'utf-8'));
  }

  console.info('Fetching speech model data from OpenRouter.');
  const response = await fetch('https://openrouter.ai/api/v1/models?output_modalities=speech');
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  return response.json();
}

type RouterSpeechModel = {
  id: string;
  name: string;
  pricing?: { prompt?: string };
  supported_voices?: string[] | null;
  expiration_date?: string | null;
};

/**
 * Keeps the models Laneway can play: ones that list their voices (the AI SDK always sends a
 * voice) and that can return MP3.
 */
export function toSpeechModels(data: { data: RouterSpeechModel[] }): SpeechModel[] {
  return data.data
    .filter((model) => (model.supported_voices?.length ?? 0) > 0)
    .filter((model) => !PCM_ONLY_PREFIXES.some((prefix) => model.id.startsWith(prefix)))
    .filter((model) => !model.expiration_date || Date.parse(model.expiration_date) > Date.now())
    .map((model) => ({
      id: model.id,
      title: model.name,
      voices: model.supported_voices ?? [],
      price: Number(model.pricing?.prompt ?? 0),
    }))
    .sort((a, b) => a.title.localeCompare(b.title));
}

export async function generateSpeechModels() {
  return toSpeechModels(await fetchSpeechModels());
}
