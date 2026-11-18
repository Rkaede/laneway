import { OPENROUTER_URL } from '~/constants';
import { EMBEDDING_DIMENSIONS } from '~/db/schema';
import { apiKeys } from '~/store/keys';

/** The model every stored embedding comes from. Changing it means embedding everything again. */
export const EMBEDDING_MODEL = 'openai/text-embedding-3-small';

/** OpenRouter's price for the model, in US dollars per token. */
export const EMBEDDING_PRICE = 0.02 / 1_000_000;

/** English text averages about four characters per token. */
const CHARACTERS_PER_TOKEN = 4;

/** Roughly what embedding this much text costs, in tokens and US dollars. */
export function embeddingCost(characters: number) {
  const tokens = Math.ceil(characters / CHARACTERS_PER_TOKEN);
  return { tokens, dollars: tokens * EMBEDDING_PRICE };
}

/** A cost in dollars, rounded to what is worth showing. */
export function formatCost(dollars: number) {
  if (dollars === 0) return '$0';
  if (dollars < 0.01) return 'less than $0.01';
  return `about $${dollars.toFixed(2)}`;
}

/**
 * Embeds texts through OpenRouter, in the same order. The AI SDK loads on first use, so it stays
 * out of the startup bundle.
 */
export async function embedTexts(values: string[], abortSignal?: AbortSignal) {
  const [{ embedMany }, { createOpenAI }] = await Promise.all([
    import('ai'),
    import('@ai-sdk/openai'),
  ]);
  const model = createOpenAI({
    apiKey: apiKeys?.openrouter,
    baseURL: OPENROUTER_URL,
  }).embedding(EMBEDDING_MODEL);
  const { embeddings } = await embedMany({
    model,
    values,
    dimensions: EMBEDDING_DIMENSIONS,
    abortSignal,
  });
  return embeddings;
}
