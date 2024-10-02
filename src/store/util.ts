import { nanoid } from 'nanoid';

import type { ChatProps, PresetProps, SessionProps } from '~/types';
import { clone } from '~/util';

export function createSessionFromPreset(preset: PresetProps) {
  const chats: ChatProps[] = preset.chats.map((c) => ({
    ...c,
    id: nanoid(),
    created: Date.now(),
    messages: [],
  }));
  const session: SessionProps = {
    ...clone(preset),
    id: nanoid(),
    title: 'Untitled',
    created: Date.now(),
    type: 'chat',
    chats: chats.map((c) => c.id),
  };
  return { session, chats };
}
