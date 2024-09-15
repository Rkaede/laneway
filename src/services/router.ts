import * as google from '~/services/google';
import * as openai from '~/services/openai';
import * as openrouter from '~/services/openrouter';
import type { MessageProps } from '~/types';

import { createThrottle, getProvider } from './util';

const providerServices = { openai, openrouter, google };

const defaultModel = 'gpt-3.5-turbo-instruct';
const throttle = createThrottle();

export async function getStream(messages: MessageProps[], modelId: string = defaultModel) {
  throttle();

  const provider = getProvider(modelId);
  if (!provider) return;

  const service = providerServices[provider.id];
  return await service.getStream(messages, modelId);
}

export async function getText(config: { messages: MessageProps[]; modelId?: string }) {
  throttle();

  const modelId = config.modelId || defaultModel;
  const provider = getProvider(modelId);

  if (!provider) return;

  const service = providerServices[provider.id];

  return await service.getText(config.messages, provider.modelId);
}
