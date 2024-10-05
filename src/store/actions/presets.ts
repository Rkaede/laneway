import { nanoid } from 'nanoid';

import { setStore, store } from '~/store';
import { addAssistant } from '~/store/actions/assistants';
import type { AssistantProps, PresetProps } from '~/types';
import { clone } from '~/util';

export function addPreset(preset: PresetProps, assistants: AssistantProps[]) {
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

export function deletePreset(id: string) {
  // Remove the preset from the presets list
  setStore('presets', (presets) => presets.filter((preset) => preset.id !== id));

  // Remove the preset from the speed dial if it exists
  setStore('speedDial', (items) =>
    items.filter((item) => !(item.type === 'preset' && item.referenceId === id)),
  );
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
