import { nanoid } from 'nanoid';

import { setStore, store } from '~/store';
import { addAssistant } from '~/store/actions/assistants';
import { assistants } from '~/store/library/assistants';
import type { PresetProps } from '~/types';
import { clone } from '~/util';

export function addPreset(preset: PresetProps) {
  const newPreset = clone(preset);
  newPreset.id = nanoid();
  newPreset.templateId = preset.id;
  setStore('presets', (p) => [...p, newPreset]);

  for (const chat of preset.chats) {
    if (chat.assistantId) {
      const assistant = assistants.find((a) => a.id === chat.assistantId);

      if (assistant) {
        const assistantInList = store.assistants.find((a) => a.id === chat.assistantId);

        if (!assistantInList) {
          addAssistant(assistant);
        }
      }
    }
  }

  return newPreset.id;
}

export function deletePreset(presetId: string) {
  setStore('presets', (p) => p.filter((p) => p.id !== presetId));
}

export function setPresetName(presetId: string, name: string) {
  setStore('presets', (p) => p.id === presetId, 'presetTitle', name);
}

export function setPresetInput(presetId: string, input: string) {
  setStore('presets', (p) => p.id === presetId, 'input', input);
}

export function addAssistantToPreset(presetId: string, assistantId: string) {
  setStore(
    'presets',
    (p) => p.id === presetId,
    'chats',
    (chats) => [...chats, { assistantId }],
  );
}

export function deleteAssistantFromPreset(presetId: string, assistantId: string) {
  setStore(
    'presets',
    (p) => p.id === presetId,
    'chats',
    (chats) => chats.filter((c) => c.assistantId !== assistantId),
  );
}
