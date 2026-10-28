import { insertNewline } from '@codemirror/commands';
import type { KeyBinding } from '@codemirror/view';

export interface InputKeymapOptions {
  mode?: 'note' | 'chat';
  coarsePointer?: boolean;
}

export function createInputKeymap(
  onSubmit: () => void,
  options: InputKeymapOptions = {},
): KeyBinding[] {
  const submit = () => {
    onSubmit();
    return true;
  };
  const isNote = options.mode === 'note';

  return [
    { key: 'Enter', run: isNote || options.coarsePointer ? insertNewline : submit },
    { key: 'Shift-Enter', run: isNote ? submit : insertNewline },
    { key: 'Mod-Enter', run: submit },
  ];
}
