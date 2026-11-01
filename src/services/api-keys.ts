import { OPENROUTER_URL } from '~/constants';

/** OpenAI keys are recognised only so the key form can say they are no longer used. */
export type KeyKind = 'openrouter' | 'openai';

/** Works out what kind of key this is from its prefix. */
export function detectKeyKind(key: string): KeyKind | undefined {
  const value = key.trim();
  if (value.startsWith('sk-or-')) return 'openrouter';
  if (value.startsWith('sk-')) return 'openai';
  return undefined;
}

/**
 * Asks OpenRouter whether it accepts the key. Anything other than a clear rejection, such as a
 * network error, is `unknown` so an outage does not stop someone from saving a good key.
 */
export async function checkApiKey(
  key: string,
  fetchFn: typeof fetch = fetch,
): Promise<'valid' | 'invalid' | 'unknown'> {
  try {
    // A cheap authenticated GET that answers 401 for a bad key and allows browser requests.
    const response = await fetchFn(`${OPENROUTER_URL}/key`, {
      headers: { Authorization: `Bearer ${key.trim()}` },
    });
    if (response.ok) return 'valid';
    if (response.status === 401 || response.status === 403) return 'invalid';
    return 'unknown';
  } catch {
    return 'unknown';
  }
}
