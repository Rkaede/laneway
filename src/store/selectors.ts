import { apiKeys } from './keys';

export const anyKeysSet = () => {
  return !!apiKeys?.openai || !!apiKeys?.google || !!apiKeys?.openrouter;
};
