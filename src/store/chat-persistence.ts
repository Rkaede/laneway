import { unwrap } from 'solid-js/store';

import type { ChatProps } from '~/types';

import { defaults, type State } from './default-state';

const withoutControllers = (key: string, value: unknown) =>
  key === 'controller' ? undefined : value;

/** The whole state, every message included, as backups need it. */
export function serializeChatStore(state: State) {
  // Stringify the raw object rather than the store's proxies, which is much faster.
  return JSON.stringify({ ...unwrap(state), dialogs: undefined }, withoutControllers);
}

/** How many of the newest sessions keep their messages in the snapshot, so they open instantly. */
const SNAPSHOT_RECENT_SESSIONS = 3;

type SnapshotOptions = {
  /** Whether the database holds this chat's messages as they are now. */
  isPersisted: (chat: ChatProps) => boolean;
  /** Sessions deleted from the store that the database still has. */
  pendingDeletes: string[];
  /** The generation of the data the store was read from. */
  generation: string | null | undefined;
};

/**
 * The state as kept in localStorage, read synchronously so the app can draw at once. A chat keeps
 * its messages only while the database lacks them, or while its session is one of the newest.
 * Every other chat is marked `unloaded`, and its messages load from the database when it opens.
 */
export function serializeSnapshot(
  state: State,
  { isPersisted, pendingDeletes, generation }: SnapshotOptions,
) {
  const raw = unwrap(state);
  const recent = new Set(
    raw.sessions
      .filter((session) => session.created !== -1)
      .sort((a, b) => b.created - a.created)
      .slice(0, SNAPSHOT_RECENT_SESSIONS)
      .flatMap((session) => session.chats),
  );
  const chats = raw.chats.map((chat) =>
    chat.unloaded || (!recent.has(chat.id) && isPersisted(chat))
      ? { ...chat, messages: [], unloaded: true }
      : chat,
  );
  return JSON.stringify(
    {
      ...raw,
      chats,
      dialogs: undefined,
      pendingDeletes: pendingDeletes.length ? pendingDeletes : undefined,
      generation: generation ?? undefined,
    },
    withoutControllers,
  );
}

export function deserializeSnapshot(serialized: string) {
  const {
    pendingDeletes = [],
    generation = null,
    ...state
  } = JSON.parse(serialized) as State & { pendingDeletes?: string[]; generation?: string };
  return { state: normalizeState(state), pendingDeletes, generation };
}

export function deserializeChatStore(serialized: string) {
  return normalizeState(JSON.parse(serialized));
}

function normalizeState(state: State) {
  state.dialogs = structuredClone(defaults.dialogs);

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
