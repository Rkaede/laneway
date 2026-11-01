// Loaded on first playback, like the chat service, so the AI SDK stays out of the startup bundle.
import { createOpenAI } from '@ai-sdk/openai';
import { generateSpeech as speak } from 'ai';

import { OPENROUTER_URL } from '~/constants';
import { apiKeys } from '~/store/keys';

/**
 * Speaks text with an OpenRouter speech model. OpenRouter's speech endpoint matches OpenAI's, so
 * the OpenAI provider pointed at OpenRouter works, as it does for chat.
 */
export async function generateSpeech(text: string, model: string, voice: string) {
  const apiKey = apiKeys?.openrouter;
  if (!apiKey) {
    throw new Error('No OpenRouter API key found');
  }

  const openrouter = createOpenAI({ apiKey, baseURL: OPENROUTER_URL });
  const { audio } = await speak({
    model: openrouter.speech(model),
    text,
    voice,
    outputFormat: 'mp3',
  });
  // Copy into a plain ArrayBuffer for Cache Storage and Blob.
  return new Uint8Array(audio.uint8Array).buffer;
}
