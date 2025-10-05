import type { PresetProps } from '../../src/types';

export const presets: PresetProps[] = [
  {
    id: 'flagship-models',
    type: 'chat',
    presetTitle: 'Flagship',
    presetDescription: 'Compare frontier models.',
    templateId: 'flagship-models',
    chats: [
      {
        modelId: 'openai/gpt-5',
        status: 'idle',
      },
      {
        modelId: 'anthropic/claude-opus-4.1',
        status: 'idle',
      },
      {
        modelId: 'google/gemini-2.5-pro',
        status: 'idle',
      },
    ],
  },
  {
    id: 'daily-driver',
    type: 'chat',
    presetTitle: 'Daily Driver',
    presetDescription: 'Good enough',
    templateId: 'daily-driver',
    chats: [
      {
        modelId: 'openai/gpt-5-mini',
        status: 'idle',
      },
      {
        modelId: 'anthropic/claude-sonnet-4.5',
        status: 'idle',
      },
      {
        modelId: 'google/gemini-2.5-flash',
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
        modelId: 'openai/gpt-4.1',
        status: 'idle',
      },
      {
        modelId: 'anthropic/claude-3.7-sonnet',
        status: 'idle',
      },
      {
        modelId: 'google/gemini-2.5-pro-preview-03-25',
        status: 'idle',
      },
    ],
    input: 'Give 10 alternatives to the following microcopy:',
  },
];
