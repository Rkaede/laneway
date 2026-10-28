import type { PresetProps } from '~/types';

export function addPresetChat(
  chats: PresetProps['chats'],
  chat: { assistantId?: string; modelId?: string },
) {
  const exists = chats.some((c) =>
    chat.assistantId
      ? c.assistantId === chat.assistantId
      : !c.assistantId && c.modelId === chat.modelId,
  );
  if (exists) return chats;

  return [...chats, { ...chat, messages: [], status: 'idle' as const }];
}

export function removePresetChat(chats: PresetProps['chats'], index: number) {
  return chats.filter((_, i) => i !== index);
}
