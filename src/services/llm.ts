import { createOpenAI, type OpenAIProvider } from '@ai-sdk/openai';
import { generateText, streamText } from 'ai';

import { OPENROUTER_URL } from '~/constants';
import { apiKeys } from '~/store/keys';
import type { MessageProps } from '~/types';

import { mockStream } from './llm-mock';
import { createThrottle, formatMessages } from './util';

// OpenAI's provider defaults to the Responses API, which stores conversations server-side and is
// not supported by OpenRouter. `.chat()` keeps the Chat Completions behavior we always had.
function chatCompletions(provider: OpenAIProvider) {
  return (modelId: string) => provider.chat(modelId);
}

const openai = () => chatCompletions(createOpenAI({ apiKey: apiKeys?.openai }));
const openrouter = () =>
  chatCompletions(createOpenAI({ apiKey: apiKeys?.openrouter, baseURL: OPENROUTER_URL }));

const services = { openai, openrouter };

type Provider = 'openai' | 'openrouter';

const throttle = createThrottle();

export async function getStream(
  messages: MessageProps[],
  modelId?: string,
  provider?: Provider,
  options?: { abortSignal?: AbortSignal },
) {
  if (!provider || !modelId) return;

  throttle();

  if (modelId === 'aperture/glados') {
    return mockStream({ abortSignal: options?.abortSignal });
  }

  // We need to create a new service each time because the API key may change there is probably
  // a slightly better way to do this but this works for now.
  const createService = services[provider];
  const service = createService();
  const formattedMessages = await formatMessages(messages);

  return streamText({
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

  const createService = services[provider];
  const service = createService();
  const formattedMessages = await formatMessages(messages);

  return await generateText({
    model: service(modelId),
    messages: formattedMessages,
  });
}

export default { getStream, getText };
