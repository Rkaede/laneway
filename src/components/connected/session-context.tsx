import type { ParentProps } from 'solid-js';
import { createContext, useContext } from 'solid-js';
import { createStore } from 'solid-js/store';

export interface SessionContextValue {
  sessionId: () => string;
  addLoadingChat: (chatId: string) => void;
  removeLoadingChat: (chatId: string) => void;
  cancelChats: () => void;
  isLoading: () => boolean;
  registerChatCancel: (chatId: string, cancel: () => void) => void;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

interface SessionProps extends ParentProps {
  sessionId: string;
}

export function SessionProvider(props: SessionProps) {
  const [store, setStore] = createStore<{
    loadingChats: string[];
    chatCancellables: Record<string, () => void>;
  }>({
    loadingChats: [],
    chatCancellables: {},
  });

  function addLoadingChat(chatId: string) {
    setStore('loadingChats', (c) => [...c, chatId]);
  }

  function removeLoadingChat(chatId: string) {
    setStore('loadingChats', (c) => c.filter((c) => c !== chatId));
  }

  function registerChatCancel(chatId: string, cancel: () => void) {
    setStore('chatCancellables', (c) => ({ ...c, [chatId]: cancel }));
  }

  function cancelChats() {
    Object.values(store.chatCancellables).forEach((cancel) => cancel());
    setStore('chatCancellables', {});
    setStore('loadingChats', []);
  }

  return (
    <SessionContext.Provider
      value={{
        sessionId: () => props.sessionId,
        addLoadingChat,
        removeLoadingChat,
        isLoading: () => store.loadingChats.length > 0,
        cancelChats,
        registerChatCancel,
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
