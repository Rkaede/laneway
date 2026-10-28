import { afterEach, beforeEach, describe, expect, it, mock, spyOn } from 'bun:test';
import { reconcile } from 'solid-js/store';

// Store actions reference icons, which use Vite-only import aliases.
mock.module('~/components/icons/ui', () => ({
  IconNewSession: () => null,
  IconSquarePen: () => null,
  IconTrash: () => null,
}));

Object.defineProperty(globalThis, 'self', { value: globalThis, configurable: true });
const fetchMock = spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([]));
const { setStore, store } = await import('..');
const { createDefaultState } = await import('../default-state');
const { models, setModels } = await import('../models');
const { addMessageToSessionChats, newDraftSession } = await import('./session-actions');
fetchMock.mockRestore();

const originalModels = [...models];

beforeEach(() => {
  setStore(reconcile(createDefaultState()));
  setModels([
    {
      id: 'model',
      title: 'Model',
      creator: { id: 'creator', name: 'Creator', website: '', icon: 'creator' },
      provider: [],
      created: 0,
    },
  ]);
  setStore('assistants', [
    { id: 'assistant', title: 'Assistant', modelId: 'model', systemPrompt: '' },
  ]);
  setStore('presets', [
    {
      id: 'preset',
      type: 'chat',
      presetTitle: 'Preset',
      chats: [{ modelId: 'model', status: 'idle' }],
    },
  ]);
});

afterEach(() => {
  setStore(reconcile(createDefaultState()));
  setModels(originalModels);
  mock.restore();
});

describe('default chat and note titles', () => {
  it.each([
    ['model', 'chat', 'New Chat'],
    ['model', 'note', 'New Note'],
    ['assistant', 'chat', 'New Chat'],
    ['assistant', 'note', 'New Note'],
    ['preset', 'chat', 'New Chat'],
  ] as const)(
    'names a %s-based %s "%s" from draft through save',
    (type, sessionType, title) => {
      newDraftSession({ type, referenceId: type, sessionType });

      expect(store.draftSession).toMatchObject({ type: sessionType, title });

      const sessionId = addMessageToSessionChats(
        { id: 'message', role: 'user', content: [{ type: 'text', text: 'Hello' }] },
        undefined,
        sessionType,
      );

      expect(store.sessions.find((session) => session.id === sessionId)).toMatchObject({
        type: sessionType,
        title,
      });
    },
  );
});
