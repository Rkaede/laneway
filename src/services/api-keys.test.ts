import { describe, expect, test } from 'bun:test';

import { checkApiKey, detectKeyKind } from './api-keys';

describe('detectKeyKind', () => {
  test('recognises OpenRouter keys before the shorter OpenAI prefix', () => {
    expect(detectKeyKind('sk-or-v1-abc')).toBe('openrouter');
    expect(detectKeyKind('  sk-or-v1-abc  ')).toBe('openrouter');
  });

  test('recognises OpenAI keys so the form can turn them away', () => {
    expect(detectKeyKind('sk-proj-abc')).toBe('openai');
    expect(detectKeyKind('sk-abc')).toBe('openai');
  });

  test('returns undefined for anything else', () => {
    expect(detectKeyKind('')).toBeUndefined();
    expect(detectKeyKind('AIza-abc')).toBeUndefined();
  });
});

describe('checkApiKey', () => {
  const respond = (status: number) => (async () => new Response(null, { status })) as never;

  test('sends the trimmed key to OpenRouter', async () => {
    const calls: [string, RequestInit | undefined][] = [];
    const fetchFn = (async (url: string, init?: RequestInit) => {
      calls.push([url, init]);
      return new Response(null, { status: 200 });
    }) as never;

    expect(await checkApiKey(' sk-or-x ', fetchFn)).toBe('valid');
    expect(calls).toEqual([
      ['https://openrouter.ai/api/v1/key', { headers: { Authorization: 'Bearer sk-or-x' } }],
    ]);
  });

  test('treats 401 and 403 as a rejected key', async () => {
    expect(await checkApiKey('sk-or-x', respond(401))).toBe('invalid');
    expect(await checkApiKey('sk-or-x', respond(403))).toBe('invalid');
  });

  test('reports other failures as unknown', async () => {
    expect(await checkApiKey('sk-or-x', respond(500))).toBe('unknown');
    const offline = (async () => {
      throw new TypeError('Failed to fetch');
    }) as never;
    expect(await checkApiKey('sk-or-x', offline)).toBe('unknown');
  });
});
