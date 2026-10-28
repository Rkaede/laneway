import { isMac } from '@solid-primitives/platform';
import { Component, createSignal, For, lazy, onCleanup, Show } from 'solid-js';

import { IconPlus, IconSendHorizontal, IconSquare } from '~/components/icons/ui';
import { Button } from '~/components/ui/button';
import config from '~/config';
import { cn } from '~/util';

import { Thumbnail } from '../ui';
import { validateAttachmentFiles } from './attachment-files';
const TextEditor = lazy(() => import('../ui/text-editor/text-editor'));

interface PromptProps {
  attachments?: File[];
  onRemoveFile?: (file: File) => void;
  class?: string;
  hasVision?: boolean;
  input: string;
  isLoading: boolean;
  onFileSelect?: (file: File) => void;
  onCancel?: () => void;
  onInput: (value: string) => void;
  onSubmit: (value: string) => void;
}

export const ChatInput: Component<PromptProps> = (props) => {
  let fileInputRef: HTMLInputElement | undefined;
  const [fileErrors, setFileErrors] = createSignal<string[]>([]);
  const [isDragging, setIsDragging] = createSignal(false);

  const handleFiles = (files: Iterable<File>) => {
    if (!props.hasVision || props.isLoading) return;

    const result = validateAttachmentFiles(files);
    setFileErrors(result.errors);
    for (const file of result.files) {
      props.onFileSelect?.(file);
    }
  };

  const handleFileSelect = (event: Event & { currentTarget: HTMLInputElement }) => {
    handleFiles(event.currentTarget.files || []);
    event.currentTarget.value = '';
  };

  const handlePasteFile = (event: ClipboardEvent) => {
    const files = event.clipboardData?.files;
    if (!files?.length) return;

    event.preventDefault();
    handleFiles(files);
  };

  const handleDragOver = (event: DragEvent) => {
    if (!event.dataTransfer?.types.includes('Files')) return;

    event.preventDefault();
    const canAttach = !!props.hasVision && !props.isLoading;
    event.dataTransfer.dropEffect = canAttach ? 'copy' : 'none';
    setIsDragging(canAttach);
  };

  const handleDragLeave = (event: DragEvent & { currentTarget: HTMLDivElement }) => {
    if (
      !(event.relatedTarget instanceof Node) ||
      !event.currentTarget.contains(event.relatedTarget)
    ) {
      setIsDragging(false);
    }
  };

  // Capture file drops before the editor reads them as text.
  const handleDrop = (event: DragEvent) => {
    if (!event.dataTransfer?.types.includes('Files')) return;

    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    handleFiles(event.dataTransfer.files);
  };

  function handleSubmit() {
    if (props.isLoading) return;
    submitForm();
  }

  const submitForm = () => {
    if (!props.input?.trim()) {
      return;
    }
    props.onSubmit(props.input);
  };

  return (
    <div
      class="relative mx-auto w-full max-w-[534px]"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      on:drop={{ handleEvent: handleDrop, capture: true }}
    >
      <Show when={props.attachments && props.attachments.length > 0}>
        <div class="absolute top-0 left-2 ml-3 flex w-full -translate-y-full gap-2 py-2">
          <For each={props.attachments || []}>
            {(file) => {
              const url = URL.createObjectURL(file);
              onCleanup(() => URL.revokeObjectURL(url));

              return (
                <Thumbnail
                  file={url}
                  alt={file.name}
                  onRemove={() => props.onRemoveFile?.(file)}
                />
              );
            }}
          </For>
        </div>
      </Show>
      <div class="mb-4 flex items-end gap-0.5">
        <form
          onSubmit={(e: Event) => {
            e.preventDefault();
            handleSubmit();
          }}
          class={cn(
            'relative flex flex-1 items-end gap-1 rounded-composer border border-composer-border bg-composer pt-0 pr-4 shadow-composer transition-[color,box-shadow] focus-within:border-field-focus focus-within:ring-(length:--field-focus-ring-w) focus-within:ring-border-focus/50',
            isDragging() && 'border-field-focus ring-2 ring-border-focus/50',
            props.hasVision ? 'pl-1.5' : 'pl-4',
            props.class,
          )}
        >
          <Show when={props.hasVision}>
            <Button
              variant="ghost"
              size="icon"
              disabled={props.isLoading}
              title={`Attach or drop PNG, JPEG, GIF or WebP images (up to ${config.attachments.maxSize / 1024 / 1024} MiB each)`}
              class="my-3 size-7 shrink-0 p-0 text-faint hover:text-main"
              onClick={() => fileInputRef?.click()}
            >
              <IconPlus class="size-4" />
              <span class="sr-only">Attach files</span>
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              multiple
              disabled={props.isLoading}
              accept={config.attachments.extensions.join(',')}
              class="hidden"
              onChange={handleFileSelect}
            />
          </Show>
          <div class="min-w-0 flex-1">
            <TextEditor
              initialValue={props.input}
              onInput={(value) => props.onInput(value)}
              onSubmit={handleSubmit}
              onPaste={handlePasteFile}
            />
          </div>

          <Show
            when={props.isLoading}
            fallback={
              <Button
                type="submit"
                variant="default"
                size="icon"
                disabled={!props.input?.trim()}
                title={`Send message (${isMac ? '⌘' : 'Ctrl'} + Enter)`}
                class="my-3 size-7 shrink-0 rounded-full bg-main p-0 text-inverse transition-transform hover:scale-110"
              >
                <IconSendHorizontal class="size-4" />
                <span class="sr-only">Send message</span>
              </Button>
            }
          >
            <Button
              variant="default"
              size="icon"
              class="absolute right-0 bottom-0 m-1.5 mb-3 size-7 rounded-full bg-main text-inverse transition-transform hover:scale-110"
              onClick={props.onCancel}
            >
              <IconSquare class="size-3" fill="currentColor" />
              <span class="sr-only">Stop</span>
            </Button>
          </Show>
        </form>
      </div>
      <Show when={fileErrors().length > 0}>
        <ul role="alert" class="-mt-2 mb-4 px-4 text-sm text-danger">
          <For each={fileErrors()}>{(error) => <li>{error}</li>}</For>
        </ul>
      </Show>
    </div>
  );
};
