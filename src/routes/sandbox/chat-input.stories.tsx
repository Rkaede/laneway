import { ChatInput } from '~/components/chat/chat-input';
import { noop } from '~/util';

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
