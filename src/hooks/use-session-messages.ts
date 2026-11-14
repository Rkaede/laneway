import { type Accessor, createEffect, createSignal } from 'solid-js';

import { store } from '~/store';
import { databaseError, loadChats } from '~/store/database';
import type { SessionProps } from '~/types';

/**
 * Loads the messages of a session's chats from the database when it opens. The newest sessions
 * keep their messages in the snapshot, so they are ready at once.
 */
export function useSessionMessages(session: Accessor<SessionProps | undefined>) {
  const [error, setError] = createSignal<Error>();
  const unloaded = () =>
    session()?.chats.some(
      (chatId) => store.chats.find((chat) => chat.id === chatId)?.unloaded,
    ) ?? false;

  createEffect(() => {
    const current = session();
    if (!current || !unloaded()) return;
    setError(undefined);
    loadChats(current.chats).catch((cause: unknown) => {
      console.error('Unable to load messages.', cause);
      setError(cause instanceof Error ? cause : new Error(String(cause)));
    });
  });

  return {
    ready: () => !unloaded(),
    error: () => error() ?? (unloaded() ? databaseError() : undefined),
  };
}
