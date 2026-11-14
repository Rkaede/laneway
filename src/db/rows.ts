import type { ChatProps, MessageProps, SessionProps } from '~/types';

/** Fields that only live in the localStorage snapshot or in memory, never in the database. */
type SessionRow = Pick<SessionProps, 'id' | 'type' | 'title' | 'created'> & {
  data: Omit<SessionProps, 'id' | 'type' | 'title' | 'created' | 'chats' | 'input'>;
};

type ChatRow = {
  id: string;
  session_id: string;
  position: number;
  data: Omit<ChatProps, 'id' | 'messages' | 'latest' | 'controller' | 'unloaded' | 'sessionId'>;
};

type MessageRow = { id: string; chat_id: string; position: number; data: MessageProps };

// The draft input changes on every keystroke and is only useful in this browser, so it stays in
// the snapshot.
export function sessionRow(session: SessionProps): SessionRow {
  const { id, type, title, created, chats: _chats, input: _input, ...data } = session;
  return { id, type, title, created, data };
}

export function chatRow(chat: ChatProps, sessionId: string, position: number): ChatRow {
  const {
    id,
    messages: _messages,
    latest: _latest,
    controller: _controller,
    unloaded: _unloaded,
    sessionId: _sessionId,
    ...data
  } = chat;
  return { id, session_id: sessionId, position, data };
}

export function messageRow(
  message: MessageProps,
  chatId: string,
  position: number,
): MessageRow {
  return { id: message.id, chat_id: chatId, position, data: message };
}

export function sessionFromRow(row: SessionRow, chatIds: string[]): SessionProps {
  return {
    ...row.data,
    id: row.id,
    type: row.type,
    title: row.title,
    created: row.created,
    chats: chatIds,
  };
}

/** A chat read without its messages, which load when its session opens. */
export function chatFromRow(row: ChatRow): ChatProps {
  return { ...row.data, id: row.id, sessionId: row.session_id, messages: [], unloaded: true };
}

/** JSON with sorted keys, so a row read back from jsonb matches the object it was written from. */
export function stableStringify(value: unknown): string {
  return JSON.stringify(value, (_key, item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) return item;
    return Object.fromEntries(
      Object.keys(item)
        .sort()
        .map((key) => [key, item[key]]),
    );
  });
}

/** cyrb53: a fast 53-bit string hash, so unchanged rows can be skipped without keeping copies. */
export function hash(text: string) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let index = 0; index < text.length; index++) {
    const code = text.charCodeAt(index);
    h1 = Math.imul(h1 ^ code, 2654435761);
    h2 = Math.imul(h2 ^ code, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}

export const signature = (value: unknown) => hash(stableStringify(value));
