import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

import { apiKeys } from '~/store/keys';
import type { MessageProps } from '~/types';

import { createThrottle } from './util';

const throttle = createThrottle();
const defaultModel = 'openai/chatgpt-4o-latest';

export async function getStream(messages: MessageProps[], model: string = defaultModel) {
  throttle();

  const openrouter = createOpenAI({
    apiKey: apiKeys?.openrouter,
    baseURL: 'https://openrouter.ai/api/v1',
  });

  const result = await streamText({
    model: openrouter(model),
    messages,
  });

  return result;
}

export async function getText(messages: MessageProps[], model: string = defaultModel) {
  throttle();

  const openai = createOpenAI({
    apiKey: apiKeys?.openrouter,
    baseURL: 'https://openrouter.ai/api/v1',
  });

  return await generateText({ model: openai(model), messages });
}
