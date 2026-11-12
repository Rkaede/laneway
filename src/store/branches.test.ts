import { describe, expect, it } from 'bun:test';

import type { ChatProps, MessageProps } from '~/types';

import { chatImageIds, createFork, defaultForkTitle, forkPrefix } from './branches';

const image = (storageId: string): MessageProps => ({
  id: 'u2',
  role: 'user',
  content: [
    { type: 'text', text: 'Look at this' },
    { type: 'image', image: { filename: 'a.png', storageId } },
  ],
});

const messages: MessageProps[] = [
  { id: 'u1', role: 'user', content: 'First question' },
  { id: 'a1', role: 'assistant', content: 'First answer', usage: { totalTokens: 5 } },
  image('photo'),
  { id: 'a2', role: 'assistant', content: 'Second answer' },
];

const chat: ChatProps = {
  id: 'chat',
  sessionId: 'parent',
  status: 'idle',
  modelId: 'model-a',
  messages,
};
const session = { id: 'parent', title: 'Parent chat' };

describe('forkPrefix', () => {
  it('keeps everything through an assistant message', () => {
    expect(forkPrefix(messages, 'a1')?.map((m) => m.id)).toEqual(['u1', 'a1']);
  });

  it('returns nothing for a user message', () => {
    expect(forkPrefix(messages, 'u2')).toBeUndefined();
  });

  it('returns nothing for an unknown message', () => {
    expect(forkPrefix(messages, 'missing')).toBeUndefined();
  });
});

describe('createFork', () => {
  it('copies the prefix into a new single-chat session that records its parent', () => {
    const fork = createFork({ session, chat, messageId: 'a1' });
    if (!fork) throw new Error('expected a fork');

    expect(fork.session.id).not.toBe(session.id);
    expect(fork.session.type).toBe('chat');
    expect(fork.session.title).toBe(defaultForkTitle('Parent chat'));
    expect(fork.session.chats).toEqual([fork.chat.id]);
    expect(fork.session.branch).toEqual({
      parentId: 'parent',
      parentTitle: 'Parent chat',
      messageId: 'a1',
      forkedMessageId: fork.chat.messages[1].id,
    });
    expect(fork.chat.sessionId).toBe(fork.session.id);
    expect(fork.chat.modelId).toBe('model-a');
    expect(fork.chat.status).toBe('idle');
    expect(fork.chat.messages.map((m) => m.content)).toEqual([
      'First question',
      'First answer',
    ]);
    expect(fork.chat.messages[1].usage).toEqual({ totalTokens: 5 });
  });

  it('gives copied messages new ids and leaves the original untouched', () => {
    const fork = createFork({ session, chat, messageId: 'a2' });
    const copiedIds = fork?.chat.messages.map((m) => m.id) ?? [];

    expect(copiedIds).toHaveLength(4);
    expect(copiedIds.some((id) => messages.some((m) => m.id === id))).toBe(false);
    expect(new Set(copiedIds).size).toBe(4);
    expect(chat.messages).toHaveLength(4);
    expect(fork?.chat.messages[0]).not.toBe(messages[0]);
  });

  it('uses a trimmed custom title, falling back to the default when blank', () => {
    expect(
      createFork({ session, chat, messageId: 'a1', title: '  Try B  ' })?.session.title,
    ).toBe('Try B');
    expect(createFork({ session, chat, messageId: 'a1', title: '   ' })?.session.title).toBe(
      'Parent chat (fork)',
    );
  });

  it('switches model or assistant, clearing the other', () => {
    const withAssistant = { ...chat, modelId: undefined, assistantId: 'helper' };
    const keep = createFork({ session, chat: withAssistant, messageId: 'a1' });
    expect(keep?.chat.assistantId).toBe('helper');

    const toModel = createFork({
      session,
      chat: withAssistant,
      messageId: 'a1',
      target: { type: 'model', id: 'model-b' },
    });
    expect(toModel?.chat.modelId).toBe('model-b');
    expect(toModel?.chat.assistantId).toBeUndefined();

    const toAssistant = createFork({
      session,
      chat,
      messageId: 'a1',
      target: { type: 'assistant', id: 'other' },
    });
    expect(toAssistant?.chat.assistantId).toBe('other');
    expect(toAssistant?.chat.modelId).toBeUndefined();
  });

  it('returns nothing when forking from a user message', () => {
    expect(createFork({ session, chat, messageId: 'u2' })).toBeUndefined();
  });

  it('returns nothing when the message is not in the chat', () => {
    expect(createFork({ session, chat, messageId: 'missing' })).toBeUndefined();
  });
});

describe('chatImageIds', () => {
  it('collects image storage ids across chats', () => {
    const ids = chatImageIds([chat, { messages: [image('other')] }]);
    expect([...ids].toSorted()).toEqual(['other', 'photo']);
  });
});
