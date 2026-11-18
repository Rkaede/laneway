import { afterEach, describe, expect, it } from 'bun:test';

import { EMBEDDING_DIMENSIONS } from '~/db/schema';
import { setApiKeys } from '~/store/keys';

import { EMBEDDING_MODEL, embeddingCost, embedTexts, formatCost } from './embeddings';

const realFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = realFetch;
});

describe('embedTexts', () => {
  it('asks OpenRouter for 512-dimension embeddings, in input order', async () => {
    setApiKeys('openrouter', 'test-key');
    const requests: { url: string; body: Record<string, unknown>; auth: string | null }[] = [];
    globalThis.fetch = (async (url: string, options: RequestInit) => {
      const body = JSON.parse(String(options.body));
      requests.push({ url, body, auth: new Headers(options.headers).get('authorization') });
      return Response.json({
        object: 'list',
        data: (body.input as string[]).map((_, index) => ({
          object: 'embedding',
          index,
          embedding: Array(EMBEDDING_DIMENSIONS).fill(index),
        })),
        usage: { prompt_tokens: 4, total_tokens: 4 },
      });
    }) as typeof fetch;

    const embeddings = await embedTexts(['first', 'second']);

    expect(requests).toHaveLength(1);
    expect(requests[0].url).toBe('https://openrouter.ai/api/v1/embeddings');
    expect(requests[0].auth).toBe('Bearer test-key');
    expect(requests[0].body).toMatchObject({
      model: EMBEDDING_MODEL,
      input: ['first', 'second'],
      dimensions: EMBEDDING_DIMENSIONS,
    });
    expect(embeddings.map((embedding) => embedding[0])).toEqual([0, 1]);
  });
});

describe('embeddingCost', () => {
  it('estimates four characters per token at $0.02 per million tokens', () => {
    expect(embeddingCost(4_000_000)).toEqual({ tokens: 1_000_000, dollars: 0.02 });
  });

  it('formats small costs without false precision', () => {
    expect(formatCost(0)).toBe('$0');
    expect(formatCost(0.0004)).toBe('less than $0.01');
    expect(formatCost(1.234)).toBe('about $1.23');
  });
});
