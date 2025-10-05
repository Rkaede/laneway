import { ModelProps } from '../../../src/types';

export const anthropic: Partial<ModelProps>[] = [
  // legacy models
  { id: 'anthropic/claude-3-haiku', title: 'Claude 3 Haiku', legacy: true },
  { id: 'anthropic/claude-3-opus', title: 'Claude 3 Opus', legacy: true },
  { id: 'anthropic/claude-3.5-sonnet', title: 'Claude 3.5 Sonnet', legacy: true },
  { id: 'anthropic/claude-3.7-sonnet', title: 'Claude 3.7 Sonnet', legacy: true },
  { id: 'anthropic/claude-sonnet-4', title: 'Claude 4 Sonnet', legacy: true },
  { id: 'anthropic/claude-opus-4', title: 'Claude Opus 4', legacy: true },
  {
    id: 'anthropic/claude-3.7-sonnet:thinking',
    title: 'Claude 3.7 Sonnet (thinking)',
    legacy: true,
  },
  // current models
  { id: 'anthropic/claude-3.5-haiku', title: 'Claude 3.5 Haiku' },
  { id: 'anthropic/claude-sonnet-4.5', title: 'Claude Sonnet 4.5' },
  { id: 'anthropic/claude-opus-4.1', title: 'Claude Opus 4.1' },
];
