import { store } from '~/store';
import { apiKeys } from '~/store/keys';
import { models } from '~/store/models';

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
