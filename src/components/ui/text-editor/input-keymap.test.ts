import { EditorState, type Transaction } from '@codemirror/state';
import { type EditorView, keymap, runScopeHandlers } from '@codemirror/view';
import { describe, expect, it, mock } from 'bun:test';

import { createInputKeymap, type InputKeymapOptions } from './input-keymap';

function createEditor(
  onSubmit: () => void,
  options: InputKeymapOptions = {},
  selection = { anchor: 5, head: 5 },
) {
  const view = {
    state: EditorState.create({
      doc: 'First line',
      selection,
      extensions: keymap.of(createInputKeymap(onSubmit, options)),
    }),
    dispatch(transaction: Transaction) {
      view.state = transaction.state;
    },
  };
  return view as EditorView;
}

function pressEnter(view: EditorView, modifiers: Partial<KeyboardEvent> = {}) {
  return runScopeHandlers(
    view,
    { key: 'Enter', keyCode: 13, ...modifiers } as KeyboardEvent,
    'editor',
  );
}

describe('editor input keymap', () => {
  const cases = [
    ['desktop chat', { mode: 'chat', coarsePointer: false }, true, false],
    ['touch chat', { mode: 'chat', coarsePointer: true }, false, false],
    ['desktop note', { mode: 'note', coarsePointer: false }, false, true],
    ['touch note', { mode: 'note', coarsePointer: true }, false, true],
  ] as const;

  it.each(cases)('%s handles Enter', (_name, options, submits) => {
    const onSubmit = mock(() => {});
    const view = createEditor(onSubmit, options);

    expect(pressEnter(view)).toBe(true);
    expect(view.state.doc.toString()).toBe(submits ? 'First line' : 'First\n line');
    expect(view.state.selection.main.head).toBe(submits ? 5 : 6);
    expect(onSubmit).toHaveBeenCalledTimes(submits ? 1 : 0);
  });

  it.each(cases)('%s handles Shift+Enter', (_name, options, _enterSubmits, submits) => {
    const onSubmit = mock(() => {});
    const view = createEditor(onSubmit, options);

    expect(pressEnter(view, { shiftKey: true })).toBe(true);
    expect(view.state.doc.toString()).toBe(submits ? 'First line' : 'First\n line');
    expect(view.state.selection.main.head).toBe(submits ? 5 : 6);
    expect(onSubmit).toHaveBeenCalledTimes(submits ? 1 : 0);
  });

  it.each(cases)(
    '%s submits with the platform modifier without changing the document',
    (_name, options) => {
      const onSubmit = mock(() => {});
      const view = createEditor(onSubmit, options);
      const isMac = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);

      expect(pressEnter(view, { metaKey: isMac, ctrlKey: !isMac })).toBe(true);
      expect(onSubmit).toHaveBeenCalledTimes(1);
      expect(view.state.doc.toString()).toBe('First line');
      expect(view.state.selection.main.head).toBe(5);
    },
  );

  it.each(cases.filter(([, , submits]) => !submits))(
    '%s replaces the selected text with a newline',
    (_name, options) => {
      const onSubmit = mock(() => {});
      const view = createEditor(onSubmit, options, { anchor: 5, head: 10 });

      expect(pressEnter(view)).toBe(true);
      expect(view.state.doc.toString()).toBe('First\n');
      expect(onSubmit).not.toHaveBeenCalled();
    },
  );

  it('defaults to desktop chat behavior', () => {
    const onSubmit = mock(() => {});
    const view = createEditor(onSubmit);

    expect(pressEnter(view)).toBe(true);
    expect(view.state.doc.toString()).toBe('First line');
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
