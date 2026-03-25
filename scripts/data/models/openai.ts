import { ModelProps } from '../../../src/types';

const openaiProvider = { id: 'openai', primary: true } as const;

export const openai: Partial<ModelProps>[] = [
  // legacy models
  {
    id: 'openai/gpt-3.5-turbo',
    title: 'GPT-3.5 Turbo',
    legacy: true,
    provider: [{  ...openaiProvider, modelId: 'gpt-3.5-turbo' }],
  },
  {
    id: 'openai/gpt-4-turbo',
    title: 'GPT-4 Turbo',
    legacy: true,
    provider: [{ ...openaiProvider, modelId: 'gpt-4-turbo' }],
  },
  {
    id: 'openai/gpt-4',
    title: 'GPT-4',
    legacy: true,
    provider: [{ ...openaiProvider, modelId: 'gpt-4' }],
  },
  {
    id: 'openai/gpt-4o',
    title: 'GPT-4o',
    legacy: true,
    provider: [{ ...openaiProvider, modelId: 'gpt-4o' }],
  },
  {
    id: 'openai/gpt-4o-mini',
    title: 'GPT-4o-mini',
    legacy: true,
    provider: [{ ...openaiProvider, modelId: 'gpt-4o-mini' }],
  },
  {
    id: 'openai/o1-mini',
    title: 'o1-mini',
    legacy: true,
    reasoning: true,
    deprecated: true,
    provider: [{ ...openaiProvider, modelId: 'o1-mini' }],
  },
  {
    id: 'openai/o1',
    title: 'o1',
    legacy: true,
    reasoning: true,
    provider: [{ ...openaiProvider, modelId: 'o1' }],
  },
  {
    id: 'openai/o3-mini-high',
    title: 'o3 Mini High',
    legacy: true,
    reasoning: true,
  },
  {
    id: 'openai/o3-mini',
    title: 'o3 Mini',
    legacy: true,
    reasoning: true,
  },
  {
    id: 'openai/gpt-4.1',
    title: 'GPT-4.1',
    legacy: true,
    provider: [{ ...openaiProvider, modelId: 'gpt-4.1' }],
  },
  {
    id: 'openai/gpt-4.1-mini',
    title: 'GPT-4.1 Mini',
    legacy: true,
    provider: [{ ...openaiProvider, modelId: 'gpt-4.1-mini' }],
  },
  {
    id: 'openai/gpt-4.1-nano',
    title: 'GPT-4.1 Nano',
    legacy: true,
    provider: [{ ...openaiProvider, modelId: 'gpt-4.1-nano' }],
  },

  // latest
  { id: 'openai/gpt-5-codex', title: 'GPT-5 Codex' },
  { id: 'openai/gpt-5-chat', title: 'GPT-5 Chat' },
  { id: 'openai/gpt-5', title: 'GPT-5' },
  { id: 'openai/gpt-5-mini', title: 'GPT-5 Mini' },
  { id: 'openai/gpt-5-nano', title: 'GPT-5 Nano' },
  { id: 'openai/gpt-oss-120b:free', title: 'gpt-oss-120b (free)', deprecated: true },
  { id: 'openai/gpt-oss-120b', title: 'gpt-oss-120b' },
  { id: 'openai/gpt-oss-20b:free', title: 'gpt-oss-20b (free)' },
  { id: 'openai/gpt-oss-20b', title: 'gpt-oss-20b' },
  { id: 'openai/gpt-5.1-codex-max', title: 'GPT-5.1 Codex Max' },
  { id: 'openai/gpt-5.1', title: 'GPT-5.1' },
  { id: 'openai/gpt-5.1-chat', title: 'GPT-5.1 Chat' },
  { id: 'openai/gpt-5.1-codex', title: 'GPT-5.1 Codex' },
  { id: 'openai/gpt-5.1-codex-mini', title: 'GPT-5.1 Codex Mini' },
  { id: 'openai/gpt-5-pro', title: 'GPT-5 Pro' },
  { id: 'openai/gpt-5.3-codex', title: 'GPT-5.3 Codex' },
  { id: 'openai/gpt-5.3-chat', title: 'GPT-5.3 Chat' },
  { id: 'openai/gpt-5.4', title: 'GPT-5.4' },
  { id: 'openai/gpt-5.4-pro', title: 'GPT-5.4 Pro' },
  { id: 'openai/gpt-5.4-mini', title: 'GPT-5.4 Mini' },
  { id: 'openai/gpt-5.4-nano', title: 'GPT-5.4 Nano' },
];
