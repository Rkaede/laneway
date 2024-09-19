import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, streamText } from 'ai';

import { apiKeys } from '~/store/keys';
import type { MessageProps } from '~/types';

import { createThrottle, formatMessages } from './util';

const defaultModel = 'models/gemini-1.5-pro-latest';
const throttle = createThrottle();

export async function getStream(messages: MessageProps[], model: string = defaultModel) {
  throttle();
  const google = createGoogleGenerativeAI({
    apiKey: apiKeys?.google,
  });

  const formattedMessages = await formatMessages(messages);
  return await streamText({ model: google(model), messages: formattedMessages });
}

export async function getText(messages: MessageProps[], model: string = defaultModel) {
  const google = createGoogleGenerativeAI({
    apiKey: apiKeys?.google,
  });
  const formattedMessages = await formatMessages(messages);
  return await generateText({ model: google(model), messages: formattedMessages });
}
