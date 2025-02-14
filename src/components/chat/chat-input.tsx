import { useLocation } from '@solidjs/router';
import { Component, createEffect, For, lazy, Show } from 'solid-js';

import { IconPaperclip, IconSquare } from '~/components/icons/ui';
import { Button } from '~/components/ui/button';
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

    if (file) {
      props.onFileSelect?.(file);
      // remove the file from the input
      (event.target as HTMLInputElement).value = '';
    }
  };

  const handlePasteFile = (event: ClipboardEvent) => {
    const file = Array.from(event.clipboardData?.items || [])
      .find((item) => item.type.startsWith('image/'))
      ?.getAsFile();

    if (file) {
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
    <div class="relative mx-auto w-full max-w-[800px]">
      <Show when={props.attachments && props.attachments.length > 0}>
        <div class="absolute left-2 top-0 ml-[50px] flex w-full -translate-y-full gap-2 py-2">
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
        {props.hasVision && (
          <div>
            <Button
              variant="bare"
              size="icon"
              disabled={!props.hasVision || props.isLoading}
              class="my-0.5 rounded-full transition-transform hover:scale-110"
              onClick={() => fileInputRef?.click()}
            >
              <IconPaperclip class="size-5 -rotate-45" />
              <span class="sr-only">Attach file</span>
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              class="hidden"
              onChange={handleFileSelect}
            />
          </div>
        )}
        <form
          onSubmit={(e: Event) => {
            e.preventDefault();
            submitForm();
          }}
          class={cn(
            'relative grid flex-1 rounded-[22px] border border-input bg-background-2 px-4 pt-0',
            props.class,
          )}
        >
          <TextEditor
            initialValue={props.input}
            onInput={(value) => props.onInput(value)}
            onSubmit={handleSubmit}
            onPaste={handlePasteFile}
          />

          <Show when={props.isLoading}>
            <Button
              variant="default"
              size="icon"
              class="absolute bottom-0 right-0 m-1.5 mb-[5px] size-7 rounded-full bg-foreground text-background transition-transform hover:scale-110"
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
