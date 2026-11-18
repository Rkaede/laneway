import { createSignal } from 'solid-js';

import { getDatabase, scheduleCheckpoint } from '~/db/client';
import {
  chunksToEmbed,
  indexMessages,
  type IndexStats,
  indexStats,
  saveEmbeddings,
} from '~/db/indexing';
import { EMBEDDING_MODEL, embedTexts } from '~/services/embeddings';

import { store } from './index';
import { apiKeys } from './keys';

/** Chunks embedded per request. OpenRouter takes up to 2,048, but smaller batches show progress. */
const EMBED_BATCH = 64;

/** The first wait after a failed request. Each further failure doubles it, up to the maximum. */
const RETRY_DELAY = 30_000;
const MAX_RETRY_DELAY = 30 * 60_000;

export type IndexerStatus = {
  stats?: IndexStats;
  embedding: boolean;
  /** Why embedding last failed, until a request succeeds. */
  error?: string;
};

const [indexerStatus, setIndexerStatus] = createSignal<IndexerStatus>({ embedding: false });

/** Progress of the search index, for the settings page. */
export { indexerStatus };

const [indexVersion, setIndexVersion] = createSignal(0);

/** Changes when new text becomes searchable, so open search results can update. */
export { indexVersion };

/** Whether semantic search is turned on and can reach OpenRouter. */
export const semanticSearchOn = () => store.settings.semanticSearch && !!apiKeys?.openrouter;

let timer: ReturnType<typeof setTimeout> | undefined;
let dueAt = 0;
let running: Promise<void> | undefined;
let again = false;
let controller: AbortController | undefined;
let retryDelay = RETRY_DELAY;
let retryAt = 0;

/**
 * Indexes new and edited messages after `delay`, then embeds new chunks when semantic search is
 * on. A run already due sooner is kept. Calls made while indexing runs share one more run
 * afterwards.
 */
export function scheduleIndexing(delay = 1000) {
  const at = Date.now() + delay;
  if (timer !== undefined && dueAt <= at) return;
  clearTimeout(timer);
  dueAt = at;
  timer = setTimeout(() => {
    timer = undefined;
    if (running) {
      again = true;
      return;
    }
    running = (async () => {
      do {
        again = false;
        await runIndexing();
      } while (again);
    })().finally(() => {
      running = undefined;
    });
  }, delay);
}

/**
 * Stops embedding, when the setting is turned off or the data is replaced. A request already sent
 * is abandoned, and its result is not saved.
 */
export function stopEmbedding() {
  controller?.abort();
}

/** Lets embedding start at once after the setting or the key changed, rather than after a wait. */
export function retryEmbeddingNow() {
  retryAt = 0;
  retryDelay = RETRY_DELAY;
  setIndexerStatus((status) => ({ ...status, error: undefined }));
  scheduleIndexing(0);
}

/** Reads how much is indexed, for the settings page. */
export async function refreshIndexStats() {
  try {
    const stats = await indexStats(await getDatabase(), EMBEDDING_MODEL);
    setIndexerStatus((status) => ({ ...status, stats }));
  } catch (error) {
    console.warn('Unable to read search index stats.', error);
  }
}

async function runIndexing() {
  try {
    const db = await getDatabase();
    if (await indexMessages(db)) {
      scheduleCheckpoint();
      setIndexVersion((version) => version + 1);
    }
    if (semanticSearchOn() && Date.now() >= retryAt) await embedPending();
  } catch (error) {
    console.error('Unable to index chats for search.', error);
  }
  await refreshIndexStats();
}

/**
 * Embeds every chunk that lacks an embedding. Only one tab embeds at a time, so tabs do not send
 * the same text twice; the others skip it.
 */
async function embedPending() {
  const work = async () => {
    controller = new AbortController();
    const { signal } = controller;
    setIndexerStatus((status) => ({ ...status, embedding: true }));
    try {
      const db = await getDatabase();
      for (;;) {
        if (signal.aborted || !semanticSearchOn()) return;
        const chunks = await chunksToEmbed(db, EMBEDDING_MODEL, EMBED_BATCH);
        if (!chunks.length) return;
        const embeddings = await embedTexts(
          chunks.map((chunk) => chunk.text),
          signal,
        );
        if (signal.aborted) return;
        await saveEmbeddings(
          db,
          EMBEDDING_MODEL,
          chunks.map((chunk, index) => ({ id: chunk.id, embedding: embeddings[index] })),
        );
        retryDelay = RETRY_DELAY;
        scheduleCheckpoint();
        setIndexVersion((version) => version + 1);
        setIndexerStatus((status) => ({ ...status, error: undefined }));
        await refreshIndexStats();
      }
    } catch (error) {
      if (signal.aborted) return;
      console.error('Unable to embed chats for search.', error);
      retryAt = Date.now() + retryDelay;
      // Retry later even if nothing else changes, then back off further if it fails again.
      scheduleIndexing(retryDelay);
      retryDelay = Math.min(retryDelay * 2, MAX_RETRY_DELAY);
      setIndexerStatus((status) => ({
        ...status,
        error: error instanceof Error ? error.message : String(error),
      }));
    } finally {
      controller = undefined;
      setIndexerStatus((status) => ({ ...status, embedding: false }));
    }
  };

  if (typeof navigator !== 'undefined' && navigator.locks) {
    await navigator.locks.request('laneway-embedding', { ifAvailable: true }, (lock) =>
      lock ? work() : undefined,
    );
  } else {
    await work();
  }
}
