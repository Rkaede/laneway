import { describe, expect, it } from 'bun:test';

import type { PresetProps } from '~/types';

import { addPresetChat, removePresetChat } from './preset-chats';

describe('preset chat selection', () => {
  it.each([{ modelId: 'model' }, { assistantId: 'assistant' }])(
    'ignores a repeated selection (%j)',
    (selection) => {
      const chats: PresetProps['chats'] = [];
      const added = addPresetChat(chats, selection);

      expect(added).toEqual([{ ...selection, messages: [], status: 'idle' }]);
      expect(addPresetChat(added, selection)).toBe(added);
      expect(chats).toEqual([]);
    },
  );

  it('keeps distinct assistants and models in selection order', () => {
    const chats: PresetProps['chats'] = [
      { assistantId: 'first', modelId: 'model', status: 'idle' },
      { assistantId: 'second', modelId: 'model', status: 'idle' },
    ];
    const added = addPresetChat(chats, { modelId: 'model' });

    expect(added).toEqual([...chats, { modelId: 'model', messages: [], status: 'idle' }]);
    expect(chats).toHaveLength(2);
    expect(addPresetChat(added, { assistantId: 'first' })).toBe(added);
  });

  it('distinguishes an assistant from a model with the same ID', () => {
    const chats = addPresetChat([], { modelId: 'shared' });
    const added = addPresetChat(chats, { assistantId: 'shared' });

    expect(added).toHaveLength(2);
    expect(addPresetChat(added, { modelId: 'shared' })).toBe(added);
    expect(addPresetChat(added, { assistantId: 'shared' })).toBe(added);
  });
});

describe('preset chat removal', () => {
  it.each([{ modelId: 'model' }, { assistantId: 'assistant' }])(
    'removes only the selected entry from existing duplicates (%j)',
    (selection) => {
      const chats: PresetProps['chats'] = [
        { ...selection, status: 'idle' },
        { modelId: 'other', status: 'idle' },
        { ...selection, status: 'error' },
      ];

      expect(removePresetChat(chats, 0)).toEqual([chats[1], chats[2]]);
      expect(removePresetChat(chats, 2)).toEqual([chats[0], chats[1]]);
      expect(removePresetChat(chats, 1)).toEqual([chats[0], chats[2]]);
      expect(chats).toHaveLength(3);
    },
  );
});
