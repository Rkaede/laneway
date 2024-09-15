import './chat-input.css';

import { useLocation } from '@solidjs/router';
import { type Component, createEffect,type JSX } from 'solid-js';

type ChatInputProps = JSX.HTMLAttributes<HTMLTextAreaElement> & {
  value: string;
};

export const ChatInput: Component<ChatInputProps> = (props) => {
  let ref: HTMLTextAreaElement | undefined;
  const location = useLocation();

  createEffect(() => {
    if (location.pathname && ref) {
      ref.focus();
    }
  });

  return (
    <div class="grow-wrap" data-replicated-value={props.value}>
      <textarea
        ref={ref}
        placeholder="Enter a message"
        class="w-full resize-none overflow-hidden bg-background-2 focus-within:outline-none sm:text-sm"
        {...props}
      />
    </div>
  );
};
