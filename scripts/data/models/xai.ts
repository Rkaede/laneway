import { ModelProps } from '../../../src/types';

export const xai: Partial<ModelProps>[] = [
  { id: 'x-ai/grok-4-fast:free', title: 'Grok 4 Fast (free)', deprecated: true },
  { id: 'x-ai/grok-4-fast', title: 'Grok 4 Fast' },
  { id: 'x-ai/grok-code-fast-1', title: 'Grok Code Fast 1' },
  { id: 'x-ai/grok-4', title: 'Grok 4' },
  { id: 'x-ai/grok-4.1-fast', title: 'Grok 4.1 Fast' },
  { id: 'x-ai/grok-4.20-beta', title: 'Grok 4.20 Beta', deprecated: true },
  {
    id: 'x-ai/grok-4.20-multi-agent-beta',
    title: 'Grok 4.20 Multi-Agent Beta',
    deprecated: true,
  },
  { id: 'x-ai/grok-4.20', title: 'Grok 4.20' },
  { id: 'x-ai/grok-4.20-multi-agent', title: 'Grok 4.20 Multi-Agent' },
  { id: 'x-ai/grok-4.3', title: 'Grok 4.3' },
  { id: 'x-ai/grok-build-0.1', title: 'Grok Build 0.1', reasoning: true },
  { id: 'x-ai/grok-4.5', title: 'Grok 4.5', reasoning: true },
  { id: 'x-ai/grok-4.6', title: 'Grok 4.6', reasoning: true },
  { id: 'x-ai/grok-4.7', title: 'Grok 4.7', reasoning: true },
];
