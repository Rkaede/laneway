import { describe, expect, it, spyOn } from 'bun:test';

import { createDefaultState } from './default-state';

describe('createDefaultState', () => {
  it('does not log session data', () => {
    const log = spyOn(console, 'log').mockImplementation(() => {});

    try {
      createDefaultState();

      expect(log).not.toHaveBeenCalled();
    } finally {
      log.mockRestore();
    }
  });

  it('uses the default session model for the initial draft', () => {
    const state = createDefaultState();

    expect(state.settings.defaultSession.type).toBe('model');
    expect(state.draftChats.map((chat) => chat.modelId)).toEqual([
      state.settings.defaultSession.id,
    ]);
  });

  it('restores the image example after its session and chat data are changed', () => {
    const state = createDefaultState();
    const session = state.sessions.find((session) => session.title === 'Vision')!;
    const chat = state.chats.find((chat) => chat.id === session.chats[0])!;
    const originalSession = structuredClone(session);
    const originalChat = structuredClone(chat);

    session.title = 'Renamed vision';
    session.input = 'Unsent prompt';
    session.chats.push('another-chat');
    chat.messages[0].content = 'Changed prompt';
    chat.messages[1].usage!.promptTokens = 0;
    chat.messages.push({ id: 'new-message', role: 'user', content: 'New message' });

    const reset = createDefaultState();

    expect(reset.sessions.find((session) => session.id === originalSession.id)).toEqual(
      originalSession,
    );
    expect(reset.chats.find((chat) => chat.id === originalChat.id)).toEqual(originalChat);
  });
});
