import type { AssistantProps, PresetProps } from '~/types';

function validateName(name: string | undefined, existingNames: (string | undefined)[]) {
  const normalized = name?.trim().toLowerCase();
  if (!normalized) return 'Name is required.';
  if (existingNames.some((existing) => existing?.trim().toLowerCase() === normalized)) {
    return 'Name is already in use.';
  }
}

export function validateAssistant(
  assistant: AssistantProps,
  assistants: AssistantProps[],
  excludeId?: string,
) {
  return (
    validateName(
      assistant.title,
      assistants.filter((a) => a.id !== excludeId).map((a) => a.title),
    ) || (!assistant.modelId.trim() ? 'Select a model.' : undefined)
  );
}

export function validatePreset(
  preset: PresetProps,
  presets: PresetProps[],
  excludeId?: string,
) {
  return validateName(
    preset.presetTitle,
    presets.filter((p) => p.id !== excludeId).map((p) => p.presetTitle),
  );
}
