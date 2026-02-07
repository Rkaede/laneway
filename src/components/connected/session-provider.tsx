import type { ParentProps } from 'solid-js';
import { createContext, useContext } from 'solid-js';

import { setStore, store } from '~/store';
import { selectChatById } from '~/store/selectors';
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

    store.chats.forEach((chat) => {
      if (props.session.chats.includes(chat.id)) {
        chat.controller?.abort();
        setStore('chats', (c) => c.id === chat.id, {
          status: 'canceled',
          controller: undefined,
        });
      }
    });
  }

  const isLoading = () => {
    if (!props.session) return false;

    return props.session.chats.some((chatId) => {
      const chat = selectChatById(chatId)();
      return chat?.status === 'loading';
    });
  };

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
