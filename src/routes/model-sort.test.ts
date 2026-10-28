import { describe, expect, it } from 'bun:test';

import type { ModelProps } from '~/types';

import { compareModels } from './model-sort';

const model = (id: string, props: Partial<ModelProps> = {}): ModelProps => ({
  id,
  title: id,
  creator: { id: 'creator', name: 'Creator', website: '', icon: 'creator' },
  provider: [],
  created: 0,
  ...props,
});

const pricing = (prompt: number, completion: number) => ({
  prompt,
  completion,
  image: 0,
  request: 0,
});

describe('model sorting', () => {
  it.each(['contextLength', 'maxCompletionTokens', 'pricing-context', 'pricing-output'])(
    'sorts %s with missing values last in both directions',
    (column) => {
      const models = [
        model('missing-first'),
        model('higher', {
          contextLength: 20,
          maxCompletionTokens: 20,
          pricing: pricing(20, 20),
        }),
        model('missing-second'),
        model('zero', {
          contextLength: 0,
          maxCompletionTokens: 0,
          pricing: pricing(0, 0),
        }),
        model('lower', {
          contextLength: 10,
          maxCompletionTokens: 10,
          pricing: pricing(10, 10),
        }),
      ];

      expect(
        [...models].sort((a, b) => compareModels(a, b, column, 'ASC')).map((m) => m.id),
      ).toEqual(['zero', 'lower', 'higher', 'missing-first', 'missing-second']);
      expect(
        [...models].sort((a, b) => compareModels(a, b, column, 'DESC')).map((m) => m.id),
      ).toEqual(['higher', 'lower', 'zero', 'missing-first', 'missing-second']);
    },
  );

  it('uses the selected pricing field', () => {
    const models = [
      model('a', { pricing: pricing(1, 2) }),
      model('b', { pricing: pricing(2, 1) }),
    ];

    expect(
      [...models]
        .sort((a, b) => compareModels(a, b, 'pricing-context', 'ASC'))
        .map((m) => m.id),
    ).toEqual(['a', 'b']);
    expect(
      [...models].sort((a, b) => compareModels(a, b, 'pricing-output', 'ASC')).map((m) => m.id),
    ).toEqual(['b', 'a']);
  });

  it.each(['creator', 'title', 'created'])('sorts %s in both directions', (column) => {
    const models = [
      model('b', {
        creator: { id: 'b', name: 'B', website: '', icon: 'b' },
        created: 2,
      }),
      model('a', {
        creator: { id: 'a', name: 'A', website: '', icon: 'a' },
        created: 1,
      }),
    ];

    expect(
      [...models].sort((a, b) => compareModels(a, b, column, 'ASC')).map((m) => m.id),
    ).toEqual(['a', 'b']);
    expect(
      [...models].sort((a, b) => compareModels(a, b, column, 'DESC')).map((m) => m.id),
    ).toEqual(['b', 'a']);
  });
});
