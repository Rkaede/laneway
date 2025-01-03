import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

import { OPENROUTER_URL } from '~/constants';
import { apiKeys } from '~/store/keys';
import type { MessageProps } from '~/types';

import { createThrottle, formatMessages } from './util';

const openai = createOpenAI({ apiKey: apiKeys?.openai, compatibility: 'strict' });
const openrouter = createOpenAI({ apiKey: apiKeys?.openrouter, baseURL: OPENROUTER_URL });
const google = createGoogleGenerativeAI({ apiKey: apiKeys?.google });

const services = { openai, openrouter, google };

type Provider = 'openai' | 'openrouter' | 'google';

const throttle = createThrottle();

export async function getStream(
  messages: MessageProps[],
  modelId?: string,
  provider?: Provider,
  options?: { abortSignal?: AbortSignal },
) {
  if (!provider || !modelId) return;

  throttle();

  const service = services[provider];
  const formattedMessages = await formatMessages(messages);

  return await streamText({
    model: service(modelId),
    messages: formattedMessages,
    abortSignal: options?.abortSignal,
  });
}

export async function getText({
  messages,
  modelId,
  provider,
}: {
  messages: MessageProps[];
  modelId?: string;
  provider?: Provider;
}) {
  if (!provider || !modelId) return;

  throttle();

  const service = services[provider];
  const formattedMessages = await formatMessages(messages);

  return await generateText({
    model: service(modelId),
    messages: formattedMessages,
  });
}
