import type { createDefaultState } from './default-state';

export function serializeChatStore(state: ReturnType<typeof createDefaultState>) {
  return JSON.stringify(state, (key, value) => (key === 'controller' ? undefined : value));
}

export function deserializeChatStore(serialized: string) {
  const state: ReturnType<typeof createDefaultState> = JSON.parse(serialized);

  for (const chat of [...state.chats, ...state.draftChats]) {
    delete chat.controller;
    // A reloaded request cannot resume; idle would automatically resend its last prompt.
    if (chat.status === 'loading') chat.status = 'canceled';
  }

  return state;
}
