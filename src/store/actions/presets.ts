import { nanoid } from 'nanoid';
import { batch } from 'solid-js';

import { setStore, store } from '~/store';
import { addAssistant } from '~/store/actions/assistants';
import { defaults } from '~/store/default-state';
import type { AssistantProps, PresetProps } from '~/types';
import { clone } from '~/util';

export function addPreset(preset: PresetProps, assistants: AssistantProps[]) {
  const newPreset = clone(preset);
  newPreset.id = nanoid();
  newPreset.templateId = preset.id;

  for (const chat of newPreset.chats) {
    if (!chat.assistantId) continue;

    const assistantInList =
      store.assistants.find((a) => a.id === chat.assistantId) ??
      store.assistants.find((a) => a.templateId === chat.assistantId);

    if (assistantInList) {
      chat.assistantId = assistantInList.id;
      continue;
    }

    const assistant = assistants.find((a) => a.id === chat.assistantId);
    if (assistant) {
      chat.assistantId = addAssistant(assistant);
    }
  }

  setStore('presets', (p) => [...p, newPreset]);
  return newPreset.id;
}

export function deletePreset(id: string) {
  batch(() => {
    if (
      store.settings.defaultSession.type === 'preset' &&
      store.settings.defaultSession.id === id
    ) {
      setStore('settings', 'defaultSession', { ...defaults.settings.defaultSession });
    }

    // Remove the preset from the presets list
    setStore('presets', (presets) => presets.filter((preset) => preset.id !== id));

    // Remove the preset from the speed dial if it exists
    setStore('speedDial', (items) =>
      items.filter((item) => !(item.type === 'preset' && item.referenceId === id)),
    );
  });
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
    (chats) => [...chats, { assistantId, status: 'idle' as const }],
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
