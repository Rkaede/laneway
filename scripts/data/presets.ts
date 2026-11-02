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
        modelId: 'openai/gpt-6.1-sol',
        status: 'idle',
      },
      {
        modelId: 'anthropic/claude-opus-5.5',
        status: 'idle',
      },
      {
        modelId: 'google/gemini-4-argon',
        status: 'idle',
      },
    ],
  },
  {
    id: 'top-shelf',
    type: 'chat',
    presetTitle: 'Top Shelf',
    presetDescription: 'The best each lab makes. Priced like it.',
    templateId: 'top-shelf',
    chats: [
      {
        modelId: 'openai/gpt-6-astra',
        status: 'idle',
      },
      {
        modelId: 'anthropic/claude-fable-5.1',
        status: 'idle',
      },
      {
        modelId: 'google/gemini-4-argon',
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
        modelId: 'openai/gpt-6.1-terra',
        status: 'idle',
      },
      {
        modelId: 'anthropic/claude-sonnet-5.5',
        status: 'idle',
      },
      {
        modelId: 'google/gemini-3.8-flash',
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
        modelId: 'openai/gpt-6.1-sol',
        status: 'idle',
      },
      {
        modelId: 'anthropic/claude-sonnet-5.5',
        status: 'idle',
      },
      {
        modelId: 'google/gemini-4-argon',
        status: 'idle',
      },
    ],
    input: 'Give 10 alternatives to the following microcopy:',
  },
];
