import { nanoid } from 'nanoid';
import { batch } from 'solid-js';

import { setStore, store } from '~/store';
import { defaults } from '~/store/default-state';
import type { AssistantProps } from '~/types';
import { clone } from '~/util';

const defaultAssistant: AssistantProps = {
  id: 'default',
  title: 'New Assistant',
  modelId: 'openai/gpt-4o',
  systemPrompt: 'You are a helpful assistant.',
  profileImage: '/icons/openai.svg',
};

export function addAssistant(assistant: AssistantProps = defaultAssistant) {
  const newAssistant = {
    ...clone(defaultAssistant),
    ...assistant,
    templateId: assistant.id,
  } as AssistantProps;
  newAssistant.id = nanoid();
  setStore('assistants', (a) => [...a, newAssistant]);
}

export function deleteAssistant(assistantId: string) {
  const assistant = store.assistants.find((a) => a.id === assistantId);
  const modelId = assistant?.modelId || defaults.settings.defaultSession.id;

  batch(() => {
    if (
      store.settings.defaultSession.type === 'assistant' &&
      store.settings.defaultSession.id === assistantId
    ) {
      setStore('settings', 'defaultSession', { type: 'model', id: modelId });
    }
    if (
      store.settings.noteModel.type === 'assistant' &&
      store.settings.noteModel.referenceId === assistantId
    ) {
      setStore('settings', 'noteModel', { type: 'model', referenceId: modelId });
    }

    const replacement = { assistantId: undefined, modelId };
    setStore('chats', (c) => c.assistantId === assistantId, replacement);
    setStore('draftChats', (c) => c.assistantId === assistantId, replacement);
    setStore('presets', {}, 'chats', (c) => c.assistantId === assistantId, replacement);

    setStore('assistants', (a) => a.filter((a) => a.id !== assistantId));

    // Remove the assistant from the speed dial if it exists
    setStore('speedDial', (sd) =>
      sd.filter((item) => !(item.type === 'assistant' && item.referenceId === assistantId)),
    );
  });
}
