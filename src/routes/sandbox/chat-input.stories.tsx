import { createSignal } from 'solid-js';

import { ChatInput } from '~/components/chat/chat-input';
import { noop } from '~/util';

import { sampleImageFile } from './story-fixtures';

export function Basic() {
  return (
    <div class="w-[600px]">
      <ChatInput
        input=""
        isLoading={false}
        onInput={noop}
        onSubmit={noop}
        onFileSelect={noop}
        onCancel={noop}
      />
    </div>
  );
}

export function Loading() {
  return (
    <div class="w-[600px]">
      <ChatInput input="" isLoading={true} onInput={noop} onSubmit={noop} onCancel={noop} />
    </div>
  );
}

export function WithVision() {
  return (
    <div class="w-[600px]">
      <ChatInput
        input=""
        onInput={noop}
        onSubmit={noop}
        hasVision
        isLoading={false}
        onCancel={noop}
      />
    </div>
  );
}

export function WithText() {
  return (
    <div class="w-[600px]">
      <ChatInput
        input="How old is earth?"
        isLoading={false}
        onInput={noop}
        onSubmit={noop}
        onCancel={noop}
      />
    </div>
  );
}

export function WithAttachments() {
  const [attachments, setAttachments] = createSignal([
    sampleImageFile('One'),
    sampleImageFile('Two', '#3f7d6e'),
  ]);

  return (
    <div class="w-[600px] pt-20">
      <ChatInput
        input=""
        hasVision
        isLoading={false}
        attachments={attachments()}
        onRemoveFile={(file) => setAttachments((files) => files.filter((f) => f !== file))}
        onFileSelect={(file) => setAttachments((files) => [...files, file])}
        onInput={noop}
        onSubmit={noop}
        onCancel={noop}
      />
    </div>
  );
}

export function Interactive() {
  const [input, setInput] = createSignal('');
  const [isLoading, setIsLoading] = createSignal(false);

  return (
    <div class="w-[600px]">
      <ChatInput
        input={input()}
        isLoading={isLoading()}
        onInput={setInput}
        onSubmit={() => {
          setInput('');
          setIsLoading(true);
        }}
        onCancel={() => setIsLoading(false)}
      />
    </div>
  );
}
