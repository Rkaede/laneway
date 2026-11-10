import { createOpenAI } from '@ai-sdk/openai';

import { OPENROUTER_URL } from '~/constants';
import { apiKeys } from '~/store/keys';
import type { MessageProps, ProviderId } from '~/types';

import { createThrottle, formatMessages } from './util';

// Created for each request, so a changed API key takes effect. OpenAI's provider defaults to the
// Responses API, which stores conversations server-side and is not supported by OpenRouter.
// `.chat()` keeps the Chat Completions behavior we always had.
function chatModel(modelId: string) {
  return createOpenAI({ apiKey: apiKeys?.openrouter, baseURL: OPENROUTER_URL }).chat(modelId);
}

const throttle = createThrottle();

export async function getStream(
  messages: MessageProps[],
  modelId?: string,
  provider?: ProviderId,
  options?: { abortSignal?: AbortSignal; systemPrompt?: string },
) {
  if (!provider || !modelId) return;

  throttle();

  if (import.meta.env.DEV && modelId === 'aperture/glados') {
    const { mockStream } = await import('./llm-mock');
    return mockStream({ abortSignal: options?.abortSignal });
  }

  const formattedMessages = await formatMessages(messages);
  const { streamText } = await import('ai');

  return streamText({
    model: chatModel(modelId),
    // The SDK rejects system messages in `messages`, so the prompt goes here. An empty prompt is
    // left out, because the SDK would send it as an empty system message.
    instructions: options?.systemPrompt || undefined,
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
  provider?: ProviderId;
}) {
  if (!provider || !modelId) return;

  throttle();

  const formattedMessages = await formatMessages(messages);
  const { generateText } = await import('ai');

  return await generateText({
    model: chatModel(modelId),
    messages: formattedMessages,
  });
}
