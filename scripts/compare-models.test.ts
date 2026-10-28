import { describe, expect, it } from 'bun:test';

import { findMissingModels } from './compare-models';

const created = Math.floor(Date.now() / 1000);

describe('findMissingModels', () => {
  it('skips batch variants of configured and missing models', async () => {
    const missing = await findMissingModels(async () => ({
      data: [
        { id: 'openai/gpt-4o:batch', created },
        { id: 'openai/new-model', name: 'New model', created },
        { id: 'openai/new-model:batch', created },
        { id: 'anthropic/batch-only:batch', created },
      ],
    }));

    expect(missing).toEqual({
      openai: [
        {
          id: 'openai/new-model',
          name: 'New model',
          provider: 'openai',
          created,
        },
      ],
    });
  });

  it('keeps non-batch variants, groups providers and sorts newest first', async () => {
    const missing = await findMissingModels(async () => ({
      data: [
        { id: 'openai/new-model:free', created: created - 1 },
        { id: 'anthropic/new-model:thinking', created },
        { id: 'openai/new-model', name: 'New model', description: 'Description', created },
      ],
    }));

    expect(missing.openai.map((model) => model.id)).toEqual([
      'openai/new-model',
      'openai/new-model:free',
    ]);
    expect(missing.openai[0]).toMatchObject({
      name: 'New model',
      description: 'Description',
    });
    expect(missing.openai[1].name).toBe('openai/new-model:free');
    expect(missing.anthropic[0].id).toBe('anthropic/new-model:thinking');
  });

  it('still skips configured, excluded, unsupported and old models', async () => {
    const missing = await findMissingModels(async () => ({
      data: [
        { id: 'openai/gpt-4o', created },
        { id: 'openai/o3', created },
        { id: 'other/new-model', created },
        { id: 'google/old-model', created: created - 2 * 365 * 24 * 60 * 60 },
      ],
    }));

    expect(missing).toEqual({});
  });

  it('handles an empty catalogue', async () => {
    expect(await findMissingModels(async () => ({ data: [] }))).toEqual({});
    expect(await findMissingModels(async () => ({}))).toEqual({});
  });
});
