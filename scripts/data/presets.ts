import type { PresetProps } from '../../src/types';

export const presets: PresetProps[] = [
  {
    id: 'full-house',
    type: 'chat',
    presetTitle: 'Flagship models',
    presetDescription: 'Compare frontier models.',
    templateId: 'full-house',
    chats: [
      {
        modelId: 'openai/gpt-4o',
        status: 'idle',
      },
      {
        modelId: 'anthropic/claude-3.5-sonnet',
        status: 'idle',
      },
      {
        modelId: 'google/gemini-pro-1.5',
        status: 'idle',
      },
    ],
  },
  {
    id: 'reasoning-duet',
    type: 'chat',
    presetTitle: 'Duet',
    presetDescription: 'The small reasoning models',
    templateId: 'reasoning-duet',
    chats: [
      {
        modelId: 'openai/o1-mini',
        status: 'idle',
      },
      {
        modelId: 'google/gemini-2.0-flash-exp:free',
        status: 'idle',
      },
    ],
  },
  {
    id: 'top-models',
    type: 'chat',
    presetTitle: 'Large frontier models',
    presetDescription: 'Claude 3 Opus & GPT-4',
    templateId: 'top-models',
    chats: [
      {
        modelId: 'openai/gpt-4',
        status: 'idle',
      },
      {
        modelId: 'anthropic/claude-3-opus',
        status: 'idle',
      },
    ],
  },
  {
    id: 'ux-writer-default',
    type: 'chat',
    presetTitle: 'UX Microcopy',
    presetDescription: 'Multiple models providing microcopy',
    templateId: 'ux-writer-default',
    chats: [
      {
        modelId: 'openai/gpt-4o',
        status: 'idle',
      },
      {
        modelId: 'anthropic/claude-3.5-sonnet',
        status: 'idle',
      },
      {
        modelId: 'google/gemini-pro-1.5',
        status: 'idle',
      },
    ],
    input: 'Give 10 alternatives to the following microcopy:',
  },
];
