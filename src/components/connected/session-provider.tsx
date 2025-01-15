import type { ParentProps } from 'solid-js';
import { createContext, useContext } from 'solid-js';

import { setStore, store } from '~/store';

export interface SessionContextValue {
  sessionId: () => string;
  cancelChats: () => void;
  isLoading: () => boolean;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

interface SessionProps extends ParentProps {
  sessionId: string;
}

export function SessionProvider(props: SessionProps) {
  function cancelChats() {
    const session = store.sessions.find((s) => s.id === props.sessionId);
    if (!session) return;

    store.chats.forEach((chat) => {
      if (session.chats.includes(chat.id)) {
        chat.controller?.abort();
        setStore('chats', (c) => c.id === chat.id, {
          status: 'canceled',
          controller: undefined,
        });
      }
    });
  }

  const isLoading = () => {
    const session = store.sessions.find((s) => s.id === props.sessionId);
    if (!session) return false;

    return session.chats.some((chatId) => {
      const chat = store.chats.find((c) => c.id === chatId);
      return chat?.status === 'loading';
    });
  };

  return (
    <SessionContext.Provider
      value={{ sessionId: () => props.sessionId, cancelChats, isLoading }}
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
