import { A } from '@solidjs/router';
import { createMemo, createResource, createSignal, For, Show } from 'solid-js';

import {
  IconExternalLink,
  IconFileText,
  IconSearch,
  IconTrash,
  IconUpload,
} from '~/components/icons/ui';
import { Button, Input } from '~/components/ui';
import { PageTitle, SectionDescription } from '~/components/ui/forms';
import { showSuccess } from '~/components/ui/notifications';
import type { DocumentRecord } from '~/db/documents';
import { DOCUMENT_ACCEPT } from '~/services/text-extraction';
import {
  addDocumentFiles,
  deleteLibraryDocument,
  documentsChanged,
  loadDocuments,
  openOriginal,
} from '~/store/library';

const TYPE_LABELS: Record<string, string> = {
  'application/pdf': 'PDF',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word',
  'text/plain': 'Text',
  'text/markdown': 'Markdown',
};

export const documentTypeLabel = (mimeType: string) => TYPE_LABELS[mimeType] ?? 'File';

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export const formatAdded = (created: number) =>
  new Date(created).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

/** Opens a document's original file, reporting a missing one. */
export async function openDocumentOriginal(document: DocumentRecord) {
  try {
    await openOriginal(document);
  } catch (error) {
    window.alert(error instanceof Error ? error.message : 'Unable to open the file.');
  }
}

/** Asks first, then deletes a document. Returns whether it was deleted. */
export async function confirmDeleteDocument(document: DocumentRecord) {
  if (!window.confirm(`Delete “${document.title}” from the library? This cannot be undone.`)) {
    return false;
  }
  await deleteLibraryDocument(document.id);
  showSuccess('Document deleted.');
  return true;
}

export default function Library() {
  const [documents] = createResource(documentsChanged, () => loadDocuments());
  const [filter, setFilter] = createSignal('');
  const [adding, setAdding] = createSignal<string>();
  const [errors, setErrors] = createSignal<{ name: string; error: string }[]>([]);
  const [dragging, setDragging] = createSignal(false);
  let fileInput!: HTMLInputElement;

  const filtered = createMemo(() => {
    const words = filter().toLowerCase().split(/\s+/).filter(Boolean);
    return (documents() ?? []).filter((document) => {
      const haystack = `${document.title} ${document.filename}`.toLowerCase();
      return words.every((word) => haystack.includes(word));
    });
  });

  async function add(files: File[]) {
    if (!files.length || adding()) return;
    setErrors([]);
    try {
      const result = await addDocumentFiles(files, (file) => setAdding(file.name));
      setErrors(result.failed);
      if (result.added.length) {
        showSuccess(
          result.added.length === 1
            ? `Added ${result.added[0].title}.`
            : `Added ${result.added.length} documents.`,
        );
      }
    } catch (error) {
      setErrors([
        { name: 'Library', error: error instanceof Error ? error.message : String(error) },
      ]);
    } finally {
      setAdding(undefined);
    }
  }

  return (
    <div
      class="h-full overflow-auto"
      onDragOver={(event) => {
        if (!event.dataTransfer?.types.includes('Files')) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        void add([...(event.dataTransfer?.files ?? [])]);
      }}
    >
      <div
        class="mx-auto flex min-h-full max-w-5xl flex-col gap-8 px-10 py-6"
        classList={{
          'outline-2 outline-dashed outline-border-focus -outline-offset-8': dragging(),
        }}
      >
        <div>
          <PageTitle>Library</PageTitle>
          <SectionDescription>
            Add PDF, Word, text and Markdown files to search them alongside your chats and
            notes. They stay in this browser.
          </SectionDescription>
        </div>
        <div class="flex items-center justify-between gap-4">
          <div class="relative grow">
            <IconSearch class="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted" />
            <Input
              type="text"
              placeholder="Filter documents..."
              aria-label="Filter documents"
              class="pl-10"
              value={filter()}
              onInput={(event) => setFilter(event.currentTarget.value)}
            />
          </div>
          <input
            ref={fileInput}
            type="file"
            multiple
            accept={DOCUMENT_ACCEPT}
            aria-label="Document files"
            class="hidden"
            onChange={(event) => {
              const files = [...(event.currentTarget.files ?? [])];
              event.currentTarget.value = '';
              void add(files);
            }}
          />
          <Button
            class="whitespace-nowrap"
            disabled={!!adding()}
            onClick={() => fileInput.click()}
          >
            <IconUpload class="size-5" />
            Add Documents
          </Button>
        </div>

        <Show when={adding()}>
          {(name) => (
            <p role="status" class="text-sm text-muted">
              Reading {name()}…
            </p>
          )}
        </Show>
        <Show when={errors().length}>
          <div role="alert" class="flex flex-col gap-1 text-sm text-danger">
            <For each={errors()}>
              {(failure) => (
                <p>
                  {failure.name}: {failure.error}
                </p>
              )}
            </For>
          </div>
        </Show>

        <Show
          when={filtered().length}
          fallback={
            <Show when={documents()}>
              <div role="status" class="flex flex-col items-center gap-2 py-12 text-center">
                <Show
                  when={filter()}
                  fallback={
                    <>
                      <p class="font-medium">No documents yet.</p>
                      <p class="text-sm text-muted">
                        Drop files here, or choose Add Documents.
                      </p>
                    </>
                  }
                >
                  <p class="font-medium">No documents match your filter.</p>
                </Show>
              </div>
            </Show>
          }
        >
          <ul class="flex flex-col divide-y divide-border rounded-lg border border-border">
            <For each={filtered()}>
              {(document) => (
                <li class="flex items-center gap-3 px-4 py-3">
                  <IconFileText class="size-5 shrink-0 text-muted" />
                  <div class="flex min-w-0 flex-1 flex-col">
                    <A
                      href={`/library/${document.id}`}
                      class="truncate font-medium hover:underline"
                    >
                      {document.title}
                    </A>
                    <span class="truncate text-xs text-muted">
                      {documentTypeLabel(document.mimeType)} · {formatSize(document.size)} ·
                      Added {formatAdded(document.created)}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Open the original of ${document.title}`}
                    title="Open original"
                    onClick={() => void openDocumentOriginal(document)}
                  >
                    <IconExternalLink class="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${document.title}`}
                    title="Delete"
                    onClick={() => void confirmDeleteDocument(document)}
                  >
                    <IconTrash class="size-4" />
                  </Button>
                </li>
              )}
            </For>
          </ul>
        </Show>
      </div>
    </div>
  );
}
