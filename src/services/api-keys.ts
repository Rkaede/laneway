import { OPENROUTER_URL } from '~/constants';

export type KeyProvider = 'openai' | 'openrouter';

export const KEY_PROVIDER_NAMES: Record<KeyProvider, string> = {
  openai: 'OpenAI',
  openrouter: 'OpenRouter',
};

// Cheap authenticated GETs. Both answer 401 for a bad key and allow browser requests.
const CHECK_URLS: Record<KeyProvider, string> = {
  openai: 'https://api.openai.com/v1/models',
  openrouter: `${OPENROUTER_URL}/key`,
};

/** Works out which provider a key belongs to from its prefix. */
export function detectKeyProvider(key: string): KeyProvider | undefined {
  const value = key.trim();
  if (value.startsWith('sk-or-')) return 'openrouter';
  if (value.startsWith('sk-')) return 'openai';
  return undefined;
}

/**
 * Asks the provider whether it accepts the key. Anything other than a clear rejection, such as
 * a network error, is `unknown` so an outage does not stop someone from saving a good key.
 */
export async function checkApiKey(
  provider: KeyProvider,
  key: string,
  fetchFn: typeof fetch = fetch,
): Promise<'valid' | 'invalid' | 'unknown'> {
  try {
    const response = await fetchFn(CHECK_URLS[provider], {
      headers: { Authorization: `Bearer ${key.trim()}` },
    });
    if (response.ok) return 'valid';
    if (response.status === 401 || response.status === 403) return 'invalid';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}
