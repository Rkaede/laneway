import { nanoid } from 'nanoid';

import { setStore } from '~/store';
import type { AssistantProps } from '~/types';
import { clone } from '~/util';

const defaultAssistant: AssistantProps = {
  id: 'default',
  title: 'New Assistant',
  modelId: 'openai-gpt-4o',
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
  setStore('assistants', (a) => a.filter((a) => a.id !== assistantId));

  // Remove the assistant from the speed dial if it exists
  setStore('speedDial', (sd) =>
    sd.filter((item) => !(item.type === 'assistant' && item.referenceId === assistantId)),
  );
}
