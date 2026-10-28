import { type createDefaultState, defaults } from './default-state';

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

  for (const assistant of state.assistants) {
    if (assistant.templateId === 'concise-responses-gpt-4o') {
      assistant.templateId = 'concise-responses';
    }
    if (assistant.templateId === 'flashcards-gpt-4o') {
      assistant.templateId = 'flashcards';
    }
  }

  const assistantIds = new Set(state.assistants.map((assistant) => assistant.id));
  const { defaultSession, noteModel } = state.settings;
  if (
    (defaultSession.type === 'assistant' && !assistantIds.has(defaultSession.id)) ||
    (defaultSession.type === 'preset' &&
      !state.presets.some((preset) => preset.id === defaultSession.id))
  ) {
    state.settings.defaultSession = { ...defaults.settings.defaultSession };
  }
  if (noteModel?.type === 'assistant' && !assistantIds.has(noteModel.referenceId)) {
    state.settings.noteModel = { ...defaults.settings.noteModel };
  }

  for (const chat of [
    ...state.chats,
    ...state.draftChats,
    ...state.presets.flatMap((preset) => preset.chats),
  ]) {
    if (chat.assistantId && !assistantIds.has(chat.assistantId)) {
      delete chat.assistantId;
      chat.modelId ||= defaults.settings.defaultSession.id;
    }
  }

  return state;
}
