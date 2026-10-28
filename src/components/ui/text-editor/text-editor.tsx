// Start of Selection
import './text-editor.css';

import { defaultKeymap, history, redo, undo } from '@codemirror/commands';
import { EditorState, Prec } from '@codemirror/state';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { isMac } from '@solid-primitives/platform';
import { inlineSuggestion } from 'codemirror-extension-inline-suggestion';
import { createCodeMirror, createEditorReadonly } from 'solid-codemirror';
import { createEffect, createSignal, onCleanup } from 'solid-js';

import { store } from '~/store';
import { getCompletion } from '~/store/actions';

import { createInputKeymap } from './input-keymap';

const fetchSuggestion = async (input: EditorState) => {
  // todo: move out of here and disable before this function is called
  if (store.settings.completions.enabled === false) return '';
  const text = input.doc.toString();
  if (!text || text.trim() === '') return '';

  console.log('Fetching suggestion for: ', text);
  const completion = await getCompletion(text);
  // or make an async API call here based on editor state
  return completion ?? '';
};
type TextEditorProps = {
  onInput?: (value: string) => void;
  initialValue?: string;
  onSubmit?: () => void;
  onPaste?: (event: ClipboardEvent) => void;
  class?: string;
  mode?: 'note' | 'chat';
  placeholder?: string;
  disabled?: boolean;
};

export function TextEditor(props: TextEditorProps) {
  const pointerQuery = window.matchMedia('(pointer: coarse)');
  const [hasCoarsePointer, setHasCoarsePointer] = createSignal(pointerQuery.matches);
  const handlePointerChange = (event: MediaQueryListEvent) =>
    setHasCoarsePointer(event.matches);
  pointerQuery.addEventListener('change', handlePointerChange);
  onCleanup(() => pointerQuery.removeEventListener('change', handlePointerChange));

  const submitShortcut = `${isMac ? '⌘' : 'Ctrl'} + Enter`;
  const inputHint = () => {
    if (props.mode === 'note') {
      return `Enter for a new line. ${submitShortcut} or Shift + Enter to send.`;
    }
    return hasCoarsePointer()
      ? `Enter for a new line. Use Send or ${submitShortcut} to send.`
      : `Enter to send. Shift + Enter for a new line. ${submitShortcut} also sends.`;
  };

  const { editorView, ref, createExtension } = createCodeMirror({
    onValueChange: (value) => {
      props.onInput?.(value);
    },
    value: props.initialValue ?? '',
  });

  createEffect(() => {
    // Value was reset after user sent a message. We update the editor value to the initialValue
    // which should be an empty string
    if (props.initialValue === '') {
      editorView()?.dispatch({
        changes: {
          from: 0,
          to: editorView()?.state.doc.length,
          insert: props.initialValue,
        },
      });
    }
  });

  // Add paste event handler
  createExtension(
    EditorView.domEventHandlers({
      paste: (event) => {
        props.onPaste?.(event);
        return false;
      },
    }),
  );

  createExtension(() =>
    placeholder(
      props.placeholder ??
        (props.mode === 'note' || hasCoarsePointer()
          ? 'Write something... Enter for a new line'
          : 'Write something... Enter to send'),
    ),
  );

  createEditorReadonly(editorView, () =>
    props.disabled === undefined ? false : props.disabled,
  );

  createExtension(history());
  createExtension(EditorView.lineWrapping);
  createExtension(keymap.of(defaultKeymap));
  if (store.featureFlags.completions) {
    createExtension(inlineSuggestion({ fetchFn: fetchSuggestion, delay: 1000 }));
  }
  createExtension(() =>
    // this doesn't work without the Prec.highest
    Prec.highest(
      keymap.of([
        // undo/redo
        { key: 'Mod-z', run: undo },
        { key: 'Mod-y', run: redo },
        { key: 'Mod-Shift-z', run: redo },
        ...createInputKeymap(() => props.onSubmit?.(), {
          mode: props.mode,
          coarsePointer: hasCoarsePointer(),
        }),
      ]),
    ),
  );

  // focus the editor when the component is mounted
  const timer = setInterval(() => {
    const view = editorView();
    view?.focus();
    view?.dispatch({
      selection: { anchor: view.state.doc.length },
    });
    if (view?.hasFocus) clearInterval(timer);
  }, 100);

  // Add this extension for accessibility
  createExtension(() =>
    EditorView.contentAttributes.of({
      'aria-label': props.mode === 'note' ? 'Note input' : 'Chat message input',
      'aria-description': inputHint(),
    }),
  );

  return (
    <div data-component="TextEditor" ref={ref} class={props.class} data-mode={props.mode} />
  );
}

export default TextEditor;
