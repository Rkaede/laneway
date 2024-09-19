import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

import { apiKeys } from '~/store/keys';
import type { MessageProps } from '~/types';

import { createThrottle, formatMessages } from './util';

const throttle = createThrottle();
const defaultModel = 'openai/chatgpt-4o-latest';
const headers = {
  'HTTP-Referer': `https://laneway.app`,
  'X-Title': `Laneway`,
};

export async function getStream(messages: MessageProps[], model: string = defaultModel) {
  throttle();

  const openrouter = createOpenAI({
    apiKey: apiKeys?.openrouter,
    baseURL: 'https://openrouter.ai/api/v1',
  });

  const formattedMessages = await formatMessages(messages);

  const result = await streamText({
    model: openrouter(model),
    messages: formattedMessages,
    headers,
  });

  return result;
}

export async function getText(messages: MessageProps[], model: string = defaultModel) {
  throttle();

  const formattedMessages = await formatMessages(messages);

  const openai = createOpenAI({
    apiKey: apiKeys?.openrouter,
    baseURL: 'https://openrouter.ai/api/v1',
  });

  return await generateText({
    model: openai(model),
    messages: formattedMessages,
    headers,
  });
}
