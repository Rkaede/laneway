import { useLocation } from '@solidjs/router';
import { Component, createEffect, For, lazy, Show } from 'solid-js';

import { IconPlus, IconSquare } from '~/components/icons/ui';
import { Button } from '~/components/ui/button';
import config from '~/config';
import { cn } from '~/util';

import { Thumbnail } from '../ui';
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

interface FileSelectDetail {
  target: { files: FileList | null };
}

const isValidImageType = (file: File): boolean => {
  return config.attachments.types.includes(file.type);
};

export const ChatInput: Component<PromptProps> = (props) => {
  let fileInputRef: HTMLInputElement | undefined;
  let ref: HTMLTextAreaElement | undefined;
  const location = useLocation();

  createEffect(() => {
    if (location.pathname && ref) {
      ref.focus();
    }
  });

  const handleFileSelect = (
    event:
      | (Event & { currentTarget: HTMLInputElement; target: Element })
      | CustomEvent<FileSelectDetail>,
  ) => {
    const file =
      'detail' in event
        ? event.detail.target.files?.[0]
        : (event.target as HTMLInputElement).files?.[0];

    if (file && isValidImageType(file)) {
      props.onFileSelect?.(file);
      // remove the file from the input
      (event.target as HTMLInputElement).value = '';
    }
  };

  const handlePasteFile = (event: ClipboardEvent) => {
    const file = Array.from(event.clipboardData?.items || [])
      .find((item) => item.type.startsWith('image/'))
      ?.getAsFile();

    if (file && isValidImageType(file)) {
      props.onFileSelect?.(file);
    }
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
    <div class="relative mx-auto w-full max-w-[534px]">
      <Show when={props.attachments && props.attachments.length > 0}>
        <div class="absolute top-0 left-2 ml-3 flex w-full -translate-y-full gap-2 py-2">
          <For each={props.attachments || []}>
            {(file) => (
              <Thumbnail
                file={URL.createObjectURL(file)}
                alt={file.name}
                onRemove={() => props.onRemoveFile?.(file)}
              />
            )}
          </For>
        </div>
      </Show>
      <div class="mb-4 flex items-end gap-0.5">
        <form
          onSubmit={(e: Event) => {
            e.preventDefault();
            submitForm();
          }}
          class={cn(
            'relative flex flex-1 items-end gap-1 rounded-composer border border-composer-border bg-composer pt-0 pr-4 shadow-composer transition-[color,box-shadow] focus-within:border-field-focus focus-within:ring-(length:--field-focus-ring-w) focus-within:ring-border-focus/50',
            props.hasVision ? 'pl-1.5' : 'pl-4',
            props.class,
          )}
        >
          <Show when={props.hasVision}>
            <Button
              variant="ghost"
              size="icon"
              disabled={props.isLoading}
              class="my-3 size-7 shrink-0 p-0 text-faint hover:text-main"
              onClick={() => fileInputRef?.click()}
            >
              <IconPlus class="size-4" />
              <span class="sr-only">Attach file</span>
            </Button>
            <input
              type="file"
              ref={fileInputRef}
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

          <Show when={props.isLoading}>
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
    </div>
  );
};
