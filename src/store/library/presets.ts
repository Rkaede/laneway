import type { PresetProps } from '~/types';

export const presets: PresetProps[] = [
  {
    id: 'full-house',
    presetTitle: 'Full House',
    presetDescription: 'Compare frontier models.',
    templateId: 'full-house',
    chats: [
      {
        modelId: 'openai/gpt-4o',
      },
      {
        modelId: 'anthropic/claude-3.5-sonnet',
      },
      {
        modelId: 'google/gemini-pro-1.5',
      },
    ],
  },
  {
    id: 'top-models',
    presetTitle: 'Large frontier models',
    presetDescription: 'Claude 3 Opus & GPT-4',
    templateId: 'top-models',
    chats: [
      {
        modelId: 'openai/gpt-4',
      },
      {
        modelId: 'anthropic/claude-3-opus',
      },
    ],
  },
  {
    id: 'ux-writer-default',
    presetTitle: 'UX Microcopy',
    presetDescription: 'Multiple models providing microcopy',
    templateId: 'ux-writer-default',
    chats: [
      {
        modelId: 'openai/gpt-4o',
      },
      {
        modelId: 'anthropic/claude-3.5-sonnet',
      },
      {
        modelId: 'google/gemini-pro-1.5',
      },
    ],
    input: 'Give 10 alternatives to the following microcopy:',
  },
];
