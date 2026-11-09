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

  it.each(['contextLength', 'maxCompletionTokens', 'pricing-context', 'pricing-output'])(
    'treats null and NaN %s as missing',
    (column) => {
      const numbers = (value: number) => ({
        contextLength: value,
        maxCompletionTokens: value,
        pricing: pricing(value, value),
      });
      const models = [
        // JSON has no undefined or NaN, so an unknown number can arrive as null.
        model('null', numbers(null as unknown as number)),
        model('higher', numbers(20)),
        model('nan', numbers(NaN)),
        model('zero', numbers(0)),
        model('missing'),
        model('lower', numbers(10)),
      ];

      expect(
        [...models].sort((a, b) => compareModels(a, b, column, 'ASC')).map((m) => m.id),
      ).toEqual(['zero', 'lower', 'higher', 'null', 'nan', 'missing']);
      expect(
        [...models].sort((a, b) => compareModels(a, b, column, 'DESC')).map((m) => m.id),
      ).toEqual(['higher', 'lower', 'zero', 'null', 'nan', 'missing']);
    },
  );

  it.each(['title', 'creator'])(
    'sorts %s alphabetically whatever the case, with numbers by value',
    (column) => {
      const names = [
        'gpt-oss-120b',
        'Sonar Pro',
        'GPT-4o',
        'Grok 4.20',
        'Gemini 2.5 Pro',
        'Grok 4.3',
      ];
      const models = names.map((name) =>
        model(name, { creator: { id: name, name, website: '', icon: '' } }),
      );
      const sorted = [
        'Gemini 2.5 Pro',
        'GPT-4o',
        'gpt-oss-120b',
        'Grok 4.3',
        'Grok 4.20',
        'Sonar Pro',
      ];

      expect(
        [...models].sort((a, b) => compareModels(a, b, column, 'ASC')).map((m) => m.id),
      ).toEqual(sorted);
      expect(
        [...models].sort((a, b) => compareModels(a, b, column, 'DESC')).map((m) => m.id),
      ).toEqual(sorted.toReversed());
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
