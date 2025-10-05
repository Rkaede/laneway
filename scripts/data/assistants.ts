import type { AssistantProps } from '../../src/types';
import { prompts } from './prompts';

export const assistants: AssistantProps[] = [
  {
    id: 'coding-sea-bodybuilder-3943',
    title: 'Coding',
    subtitle: 'Sea-Bodybuilder-3943',
    modelId: 'anthropic/claude-sonnet-4.5',
    templateId: 'coding-sea-bodybuilder-3943',
    ...prompts.codingSeaBodybuilder3943,
  },
  {
    id: 'concise-responses-gpt-4o',
    title: 'Concise Responses',
    subtitle: 'General purpose',
    modelId: 'openai/gpt-5',
    templateId: 'concise-responses-gpt-4o',
    ...prompts.succinct,
  },
  {
    id: 'flashcards-gpt-4o',
    title: 'Flashcard Creator',
    subtitle: 'Transform text into memorable cards',
    modelId: 'openai/gpt-5-mini',
    templateId: 'flashcards-gpt-4o',
    ...prompts.flashcards,
  },
];
