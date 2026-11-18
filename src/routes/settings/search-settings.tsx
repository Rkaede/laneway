import { createEffect, on, onMount, Show } from 'solid-js';

import { Switch, SwitchControl, SwitchLabel, SwitchThumb, Tag } from '~/components/ui';
import { embeddingCost, formatCost } from '~/services/embeddings';
import { setStore, store } from '~/store';
import { startDatabase } from '~/store/database';
import {
  indexerStatus,
  refreshIndexStats,
  retryEmbeddingNow,
  stopEmbedding,
} from '~/store/indexer';
import { anyKeysSet } from '~/store/selectors';

import { Section, Setting, SettingControl } from './shared';

const numberFormat = new Intl.NumberFormat();

/** What indexing the text not embedded yet would cost. */
function pendingCost() {
  const characters = indexerStatus().stats?.pendingCharacters ?? 0;
  const { tokens, dollars } = embeddingCost(characters);
  return `about ${numberFormat.format(tokens)} tokens, ${formatCost(dollars)}`;
}

export function SearchSettings() {
  const enabled = () => anyKeysSet() && store.settings.semanticSearch;

  onMount(() => {
    void startDatabase().then(refreshIndexStats);
  });

  // Keep the numbers current while this page is open and embedding runs.
  createEffect(on(() => indexerStatus().embedding, refreshIndexStats, { defer: true }));

  async function toggle(on: boolean) {
    if (!on) {
      setStore('settings', 'semanticSearch', false);
      stopEmbedding();
      return;
    }
    await startDatabase();
    await refreshIndexStats();
    const confirmed = window.confirm(
      'Semantic search sends the text of your chats, notes and documents to OpenRouter, ' +
        `which embeds it with OpenAI's text-embedding-3-small model.\n\n` +
        `Indexing what you have now will use ${pendingCost()}. ` +
        'New messages are indexed as you go.',
    );
    if (!confirmed) return;
    setStore('settings', 'semanticSearch', true);
    retryEmbeddingNow();
  }

  const stats = () => indexerStatus().stats;

  return (
    <Section
      title="Search"
      description="How the command menu finds chats, notes and documents."
    >
      <Setting
        inline
        title="Semantic Search"
        description={
          <>
            Also find results by meaning, not only by matching words. Your text is sent to
            OpenRouter to index it.
            <Show when={!anyKeysSet()}>
              <div class="mt-2">
                <Tag variant="warning">OpenRouter API key not configured</Tag>
              </div>
            </Show>
          </>
        }
      >
        <SettingControl>
          <Switch
            disabled={!anyKeysSet()}
            checked={enabled()}
            onChange={(value) => void toggle(value)}
          >
            <SwitchLabel class="sr-only">Semantic search</SwitchLabel>
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
          </Switch>
        </SettingControl>
      </Setting>
      <Show when={stats()}>
        {(current) => (
          <p role="status" class="text-sm text-muted">
            <Show
              when={enabled()}
              fallback={
                current().pending > 0
                  ? `Indexing your current data would use ${pendingCost()}.`
                  : 'Nothing to index yet.'
              }
            >
              {numberFormat.format(current().embedded)} passages indexed.
              <Show when={current().pending > 0}>
                {' '}
                {numberFormat.format(current().pending)} waiting
                {indexerStatus().embedding ? ', indexing now' : ''}, {pendingCost()}.
              </Show>
            </Show>
          </p>
        )}
      </Show>
      <Show when={enabled() && indexerStatus().error}>
        <p role="alert" class="text-sm text-danger">
          Indexing failed: {indexerStatus().error} It will try again shortly.
        </p>
      </Show>
    </Section>
  );
}
