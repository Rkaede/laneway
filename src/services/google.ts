import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { generateText, streamText } from 'ai';

import { apiKeys } from '~/store/keys';
import type { MessageProps } from '~/types';

import { createThrottle } from './util';

const throttle = createThrottle();

export async function getStream(messages: MessageProps[]) {
  throttle();

  const google = createGoogleGenerativeAI({
    apiKey: apiKeys?.google,
  });

  const result = await streamText({
    model: google('models/gemini-1.5-pro-latest'),
    messages,
  });

  return result;
}

export async function getText(messages: MessageProps[], model: string) {
  const google = createGoogleGenerativeAI({
    apiKey: apiKeys?.google,
  });
  return await generateText({ model: google(model), messages });
}
