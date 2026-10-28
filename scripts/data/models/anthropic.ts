import { ModelProps } from '../../../src/types';

export const anthropic: Partial<ModelProps>[] = [
  // legacy models
  { id: 'anthropic/claude-3-haiku', title: 'Claude 3 Haiku', legacy: true },
  { id: 'anthropic/claude-3-opus', title: 'Claude 3 Opus', legacy: true, deprecated: true },
  { id: 'anthropic/claude-3.5-sonnet', title: 'Claude 3.5 Sonnet', legacy: true },
  { id: 'anthropic/claude-3.7-sonnet', title: 'Claude 3.7 Sonnet', legacy: true },
  { id: 'anthropic/claude-sonnet-4', title: 'Claude Sonnet 4', legacy: true },
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
  { id: 'anthropic/claude-opus-4.5', title: 'Claude Opus 4.5' },
  { id: 'anthropic/claude-haiku-4.5', title: 'Claude Haiku 4.5' },
  { id: 'anthropic/claude-sonnet-4.6', title: 'Claude Sonnet 4.6' },
  { id: 'anthropic/claude-opus-4.6', title: 'Claude Opus 4.6' },
  { id: 'anthropic/claude-opus-4.7', title: 'Claude Opus 4.7' },
  { id: 'anthropic/claude-opus-4.8', title: 'Claude Opus 4.8' },
  { id: 'anthropic/claude-fable-5', title: 'Claude Fable 5', reasoning: true },
  { id: 'anthropic/claude-sonnet-5', title: 'Claude Sonnet 5' },
  { id: 'anthropic/claude-opus-5', title: 'Claude Opus 5' },
  { id: 'anthropic/claude-fable-5.1', title: 'Claude Fable 5.1', reasoning: true },
  { id: 'anthropic/claude-opus-5.5', title: 'Claude Opus 5.5', reasoning: true },
  { id: 'anthropic/claude-sonnet-5.5', title: 'Claude Sonnet 5.5', reasoning: true },
  { id: 'anthropic/claude-haiku-5.5', title: 'Claude Haiku 5.5' },
];
