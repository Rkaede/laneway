/* eslint-disable @typescript-eslint/no-explicit-any */
import { createStore } from 'solid-js/store';

import type { MessageProps } from '~/types';

type UseChat = {
  // todo: fix this type
  streamFn: any;
  onFinish: (message: MessageProps) => void;
  onError?: (error: Error) => void;
};

type ChatStore = {
  latest: MessageProps | undefined;
  status: 'idle' | 'loading' | 'error';
  append: (messages: MessageProps[]) => Promise<void>;
};

export function useChat({ streamFn, onFinish, onError }: UseChat) {
  const [store, setStore] = createStore<ChatStore>({
    latest: undefined as MessageProps | undefined,
    status: 'idle',
    append: async (messages: MessageProps[]) => {
      try {
        setStore('status', 'loading');
        const stream = await streamFn(messages);
        let latestContent = '';
        for await (const textPart of stream.textStream) {
          latestContent += textPart;
          setStore('latest', { role: 'assistant', content: latestContent });
        }
        setStore({ status: 'idle', latest: undefined });
        onFinish({ role: 'assistant', content: latestContent });
      } catch (error: unknown) {
        setStore({ status: 'error', latest: undefined });
        onError?.(error as Error);
      }
    },
  });

  return store;
}
