import { nanoid } from 'nanoid';

import type { ChatProps, PresetProps, SessionProps } from '~/types';
import { clone } from '~/util';

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
