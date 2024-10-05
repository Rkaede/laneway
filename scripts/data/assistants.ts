import type { AssistantProps } from '../../src/types';
import { prompts } from './prompts';

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
