import { unwrap } from 'solid-js/store';

import { getDatabase } from '~/db/client';
import { EMBEDDING_MODEL, embedTexts } from '~/services/embeddings';

import { store } from './index';
import { semanticSearchOn } from './indexer';
import { models } from './models';
import { search, type SearchResults } from './search';

/** Queries shorter than this are still being typed, and say too little to search by meaning. */
const MIN_SEMANTIC_QUERY = 3;

/** Embeddings of recent queries, so typing back to an earlier query does not ask again. */
const queryEmbeddings = new Map<string, Promise<number[] | undefined>>();
const MAX_CACHED_QUERIES = 50;

/**
 * The embedding of a query, or undefined when semantic search is off or the request fails. A
 * failure leaves keyword results to stand on their own.
 */
export function embedQuery(query: string): Promise<number[] | undefined> {
  const text = query.trim().toLowerCase();
  if (!semanticSearchOn() || text.length < MIN_SEMANTIC_QUERY)
    return Promise.resolve(undefined);
  let embedding = queryEmbeddings.get(text);
  if (!embedding) {
    embedding = embedTexts([text]).then(
      ([vector]) => vector,
      (error) => {
        console.warn('Unable to embed the search query.', error);
        queryEmbeddings.delete(text);
        return undefined;
      },
    );
    queryEmbeddings.set(text, embedding);
    if (queryEmbeddings.size > MAX_CACHED_QUERIES) {
      queryEmbeddings.delete(queryEmbeddings.keys().next().value!);
    }
  }
  return embedding;
}

/** Searches chats, notes and documents, by meaning too when the query's embedding is given. */
export async function searchEverything(
  query: string,
  embedding?: number[],
): Promise<SearchResults> {
  if (!query.trim()) return { sessions: [], documents: [] };
  const { sessions, chats, assistants } = unwrap(store);
  return search(await getDatabase(), query, { sessions, chats, assistants }, unwrap(models), {
    embedding: embedding && { vector: embedding, model: EMBEDDING_MODEL },
  });
}
