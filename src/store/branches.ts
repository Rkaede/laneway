import { nanoid } from 'nanoid';

import type { ChatProps, MessageProps, SessionProps } from '~/types';
import { clone } from '~/util';

export function defaultForkTitle(title: string) {
  return `${title} (fork)`;
}

/**
 * The part of a chat to copy into a fork: everything up to and including the chosen response.
 * Only responses can be forked from, so any other message gives nothing.
 */
export function forkPrefix(messages: MessageProps[], messageId: string) {
  const index = messages.findIndex((message) => message.id === messageId);
  if (messages[index]?.role !== 'assistant') return undefined;
  return messages.slice(0, index + 1);
}

/** A model or assistant for a fork to continue with. */
export type ForkTarget = { type: 'model' | 'assistant'; id: string };

type ForkOptions = {
  session: Pick<SessionProps, 'id' | 'title'>;
  chat: ChatProps;
  messageId: string;
  title?: string;
  /** Continue with a different model or assistant. The default keeps the chat's own. */
  target?: ForkTarget;
};

/** The model and assistant a fork continues with. Picking one clears the other. */
function forkAgent(chat: ChatProps, target: ForkTarget | undefined) {
  if (!target) return { modelId: chat.modelId, assistantId: chat.assistantId };
  if (target.type === 'model') return { modelId: target.id, assistantId: undefined };
  return { modelId: undefined, assistantId: target.id };
}

/** Build a new single-chat session holding a copy of one chat up to the chosen message. */
export function createFork({ session, chat, messageId, title, target }: ForkOptions) {
  const prefix = forkPrefix(chat.messages, messageId);
  if (!prefix) return undefined;

  // Copies get new ids so audio caches and other per-message state never cross branches.
  const messages = clone(prefix).map((message) => ({ ...message, id: nanoid() }));
  const now = Date.now();
  const sessionId = nanoid();
  const forkedChat: ChatProps = {
    id: nanoid(),
    sessionId,
    created: now,
    messages,
    status: 'idle',
    ...forkAgent(chat, target),
  };
  const forkedSession: SessionProps = {
    id: sessionId,
    title: title?.trim() || defaultForkTitle(session.title),
    type: 'chat',
    created: now,
    chats: [forkedChat.id],
    input: '',
    branch: {
      parentId: session.id,
      parentTitle: session.title,
      messageId,
      forkedMessageId: messages[messages.length - 1].id,
    },
  };
  return { session: forkedSession, chat: forkedChat };
}

/** Storage ids of the images that the given chats show. */
export function chatImageIds(chats: Pick<ChatProps, 'messages'>[]) {
  const ids = new Set<string>();
  for (const chat of chats) {
    for (const message of chat.messages) {
      if (typeof message.content === 'string') continue;
      for (const part of message.content) {
        if (part.type === 'image' && part.image.storageId) ids.add(part.image.storageId);
      }
    }
  }
  return ids;
}
