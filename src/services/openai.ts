import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

import { apiKeys } from '~/store/keys';
import type { MessageProps } from '~/types';

import { createThrottle, formatMessages } from './util';

const defaultModel = 'gpt-3.5-turbo-instruct';
const throttle = createThrottle();

export async function getStream(messages: MessageProps[], model: string = defaultModel) {
  throttle();
  const openai = createOpenAI({
    apiKey: apiKeys?.openai,
    compatibility: 'strict',
  });

  const formattedMessages = await formatMessages(messages);
  return await streamText({ model: openai(model), messages: formattedMessages });
}

export async function getText(messages: MessageProps[], model: string = defaultModel) {
  const openai = createOpenAI({
    apiKey: apiKeys?.openai,
    compatibility: 'strict',
  });
  const formattedMessages = await formatMessages(messages);
  return await generateText({ model: openai(model), messages: formattedMessages });
}
