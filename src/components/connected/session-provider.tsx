import type { ParentProps } from 'solid-js';
import { createContext, createMemo, useContext } from 'solid-js';

import { cancel } from '~/services/chat-controller';
import { store } from '~/store';
import type { SessionProps as StoreSessionProps } from '~/types';

export interface SessionContextValue {
  sessionId: () => string;
  cancelChats: () => void;
  isLoading: () => boolean;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

interface SessionProps extends ParentProps {
  sessionId?: string;
  session: StoreSessionProps;
}

export function SessionProvider(props: SessionProps) {
  function cancelChats() {
    if (!props.session) return;

    props.session.chats.forEach((chatId) => {
      cancel({ chatId });
    });
  }

  const isLoading = createMemo(() => {
    if (!props.session) return false;

    return props.session.chats.some((chatId) => {
      const chat = store.chats.find((c) => c.id === chatId);
      return chat?.status === 'loading';
    });
  });

  return (
    <SessionContext.Provider
      value={{
        sessionId: () => props.sessionId ?? props.session.id,
        cancelChats,
        isLoading,
      }}
    >
      {props.children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const value = useContext(SessionContext);

  if (!value) {
    throw new Error('Missing context Provider');
  }

  return value;
}
