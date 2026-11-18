import { A, useNavigate, useParams, useSearchParams } from '@solidjs/router';
import { createEffect, createResource, For, on, onCleanup, Show } from 'solid-js';

import { IconArrowLeft, IconExternalLink, IconTrash } from '~/components/icons/ui';
import { Button } from '~/components/ui';
import { PageTitle } from '~/components/ui/forms';
import { documentsChanged, loadDocument } from '~/store/library';

import {
  confirmDeleteDocument,
  documentTypeLabel,
  formatAdded,
  formatSize,
  openDocumentOriginal,
} from './library';

const HIGHLIGHT_CLASSES = ['bg-surface-hover', 'ring-2', 'ring-border-focus/60'];
const HIGHLIGHT_MS = 2000;

/** One document's text, as search reads it. `?chunk=` scrolls to the passage a search found. */
export default function LibraryDocument() {
  const params = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams<{ chunk?: string }>();
  const navigate = useNavigate();
  const [document] = createResource(
    () => [params.id, documentsChanged()] as const,
    ([id]) => loadDocument(id),
  );

  createEffect(
    on(
      () => [searchParams.chunk, document()] as const,
      ([chunk, loaded]) => {
        if (!chunk || !loaded) return;
        const frame = requestAnimationFrame(() => {
          const element = window.document.getElementById(`chunk-${chunk}`);
          if (element) {
            element.scrollIntoView({ block: 'center' });
            element.classList.add(...HIGHLIGHT_CLASSES);
            setTimeout(() => element.classList.remove(...HIGHLIGHT_CLASSES), HIGHLIGHT_MS);
          }
          setSearchParams({ chunk: undefined }, { replace: true });
        });
        onCleanup(() => cancelAnimationFrame(frame));
      },
    ),
  );

  return (
    <div class="h-full overflow-auto">
      <div class="mx-auto flex max-w-3xl flex-col gap-6 px-10 py-6">
        <A href="/library" class="flex items-center gap-1 text-sm text-muted hover:text-main">
          <IconArrowLeft class="size-4" />
          Library
        </A>
        <Show
          when={document()}
          fallback={
            <Show when={!document.loading}>
              <p role="status">This document is not in the library.</p>
            </Show>
          }
        >
          {(current) => (
            <>
              <div class="flex items-start justify-between gap-4">
                <div class="min-w-0">
                  <PageTitle>{current().title}</PageTitle>
                  <p class="text-sm text-muted">
                    {current().filename} · {documentTypeLabel(current().mimeType)} ·{' '}
                    {formatSize(current().size)} · Added {formatAdded(current().created)}
                  </p>
                </div>
                <div class="flex shrink-0 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => void openDocumentOriginal(current())}
                  >
                    <IconExternalLink class="size-4" />
                    Open Original
                  </Button>
                  <Button
                    variant="outline"
                    aria-label="Delete document"
                    onClick={async () => {
                      if (await confirmDeleteDocument(current())) navigate('/library');
                    }}
                  >
                    <IconTrash class="size-4" />
                  </Button>
                </div>
              </div>
              <article class="flex flex-col gap-4 text-sm leading-relaxed">
                <For each={current().chunks}>
                  {(chunk) => (
                    <p
                      id={`chunk-${chunk.id}`}
                      class="-mx-2 rounded-md px-2 whitespace-pre-wrap transition-colors"
                    >
                      {chunk.text}
                    </p>
                  )}
                </For>
              </article>
            </>
          )}
        </Show>
      </div>
    </div>
  );
}
