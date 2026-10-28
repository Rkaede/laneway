import { nanoid } from 'nanoid';

import type { AssistantProps, ChatProps, ModelProps, PresetProps, SessionProps } from '~/types';
import { clone } from '~/util';

export function getChatModel(
  chat: Pick<ChatProps, 'assistantId' | 'modelId'> | undefined,
  assistants: AssistantProps[],
  models: ModelProps[],
): ModelProps | undefined {
  const assistant = assistants.find((a) => a.id === chat?.assistantId);
  return models.find((m) => m.id === (assistant?.modelId ?? chat?.modelId));
}

export function createSessionFromPreset(preset: PresetProps) {
  const sessionId = nanoid();
  const chats: ChatProps[] = preset.chats.map((c) => ({
    ...c,
    id: nanoid(),
    sessionId,
    created: Date.now(),
    messages: [],
    status: 'idle',
  }));
  const session: SessionProps = {
    ...clone(preset),
    id: sessionId,
    title: 'Untitled',
    created: Date.now(),
    type: 'chat',
    chats: chats.map((c) => c.id),
  };
  return { session, chats };
}
