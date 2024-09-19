import { CoreMessage, CoreUserMessage } from 'ai';

import { store } from '~/store';
import { apiKeys } from '~/store/keys';
import { models } from '~/store/models';
import { MessageProps } from '~/types';
import { base64EncodeFile } from '~/util';

import { imageCache } from './image-cache';

export function createThrottle(maxCalls = 10, timeWindow = 60) {
  const callQueue: number[] = [];

  function throttle() {
    const now = Date.now();
    callQueue.push(now);

    // Remove timestamps older than timeWindow
    while (callQueue.length > 0 && now - callQueue[0] > timeWindow * 1000) {
      callQueue.shift();
    }

    if (callQueue.length > maxCalls) {
      throw new Error('Rate limit exceeded. Try again later.');
    }
  }

  return throttle;
}

export function getProvider(modelId: string) {
  const currentModel = () => models.find((m) => m.id === modelId);
  if (!currentModel()) return undefined;

  const { openRouterUsage } = store.settings;
  const modelProviders = currentModel()?.provider;
  const primaryProvider = modelProviders?.find((h) => h.primary);
  const openrouterProvider = modelProviders?.find((h) => h.id === 'openrouter');
  const isOpenRouterConfigured = !!apiKeys?.openrouter;

  if (openRouterUsage === 'always' && openrouterProvider && isOpenRouterConfigured) {
    return openrouterProvider;
  }

  if (openRouterUsage === 'fallback' && primaryProvider) {
    const isPrimaryApiKeySet = !!apiKeys?.[primaryProvider.id];

    if (isPrimaryApiKeySet) {
      return primaryProvider;
    }
    if (openrouterProvider && isOpenRouterConfigured) {
      return openrouterProvider;
    }
  }

  return primaryProvider;
}

export async function formatMessages(messages: MessageProps[]): Promise<CoreMessage[]> {
  return Promise.all(
    messages.map(async (message) => {
      if (message.role === 'user') {
        const content = Array.isArray(message.content)
          ? message.content
          : [{ type: 'text', text: message.content }];
        const formattedParts = await Promise.all(
          content.map(async (part) => {
            if (part.type === 'image' && 'image' in part) {
              const imageData = await imageCache.get('/' + part.image.storageId);
              if (!imageData) return part;
              const file = new File([imageData], part.image.filename, { type: imageData.type });
              const base64Image = await base64EncodeFile(file);
              return { type: 'image', image: base64Image };
            }
            return part;
          }),
        );
        return {
          role: 'user' as const,
          content: formattedParts,
        } as CoreUserMessage;
      }
      return message as CoreMessage;
    }),
  );
}
