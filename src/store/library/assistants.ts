import type { AssistantProps } from '~/types';

import codingSeaBodybuilder3943 from '../prompts/coding-sea-bodybuilder-3943.md?raw';
import flashcards from '../prompts/flashcards.txt?raw';
import succinct from '../prompts/succinct.txt?raw';

const prompts = {
  succinct: {
    description:
      'Natural voice that is succinct, clear, professional, matter-of-fact, with no buzzwords or exaggeration',
    systemPrompt: succinct,
  },
  flashcards: {
    description:
      'Create Anki flashcards from a given text, following three key principles: the minimum information principle, optimized wording, and no external context.',
    systemPrompt: flashcards,
  },
  codingSeaBodybuilder3943: {
    description:
      'https://www.reddit.com/r/PromptEngineering/comments/1eogo2a/coding_system_prompt/lhjqhry/',
    systemPrompt: codingSeaBodybuilder3943,
  },
};

export const assistants: AssistantProps[] = [
  {
    id: 'coding-sea-bodybuilder-3943',
    title: 'Coding',
    subtitle: 'Sea-Bodybuilder-3943',
    modelId: 'anthropic/claude-3.5-sonnet',
    templateId: 'coding-sea-bodybuilder-3943',
    ...prompts.codingSeaBodybuilder3943,
  },
  {
    id: 'concise-responses-gpt-4o',
    title: 'Concise Responses',
    subtitle: 'General purpose',
    modelId: 'openai/gpt-4o',
    templateId: 'concise-responses-gpt-4o',
    ...prompts.succinct,
  },
  {
    id: 'flashcards-gpt-4o',
    title: 'Flashcard Creator',
    subtitle: 'Transform text into memorable cards',
    modelId: 'openai/gpt-4o',
    templateId: 'flashcards-gpt-4o',
    ...prompts.flashcards,
  },
];
