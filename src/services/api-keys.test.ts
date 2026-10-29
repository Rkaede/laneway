import { describe, expect, test } from 'bun:test';

import { checkApiKey, detectKeyProvider } from './api-keys';

describe('detectKeyProvider', () => {
  test('recognises OpenRouter keys before the shorter OpenAI prefix', () => {
    expect(detectKeyProvider('sk-or-v1-abc')).toBe('openrouter');
    expect(detectKeyProvider('  sk-or-v1-abc  ')).toBe('openrouter');
  });

  test('recognises OpenAI keys', () => {
    expect(detectKeyProvider('sk-proj-abc')).toBe('openai');
    expect(detectKeyProvider('sk-abc')).toBe('openai');
  });

  test('returns undefined for anything else', () => {
    expect(detectKeyProvider('')).toBeUndefined();
    expect(detectKeyProvider('AIza-abc')).toBeUndefined();
  });
});

describe('checkApiKey', () => {
  const respond = (status: number) => (async () => new Response(null, { status })) as never;

  test('sends the trimmed key to the provider', async () => {
    const calls: [string, RequestInit | undefined][] = [];
    const fetchFn = (async (url: string, init?: RequestInit) => {
      calls.push([url, init]);
      return new Response(null, { status: 200 });
    }) as never;

    expect(await checkApiKey('openrouter', ' sk-or-x ', fetchFn)).toBe('valid');
    expect(calls).toEqual([
      ['https://openrouter.ai/api/v1/key', { headers: { Authorization: 'Bearer sk-or-x' } }],
    ]);
  });

  test('treats 401 and 403 as a rejected key', async () => {
    expect(await checkApiKey('openai', 'sk-x', respond(401))).toBe('invalid');
    expect(await checkApiKey('openai', 'sk-x', respond(403))).toBe('invalid');
  });

  test('reports other failures as unknown', async () => {
    expect(await checkApiKey('openai', 'sk-x', respond(500))).toBe('unknown');
    const offline = (async () => {
      throw new TypeError('Failed to fetch');
    }) as never;
    expect(await checkApiKey('openai', 'sk-x', offline)).toBe('unknown');
  });
});
