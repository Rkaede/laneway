// Start of Selection
import './text-editor.css';

import { defaultKeymap, history, redo, undo } from '@codemirror/commands';
import { EditorState, Prec } from '@codemirror/state';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { inlineSuggestion } from 'codemirror-extension-inline-suggestion';
import { createCodeMirror, createEditorReadonly } from 'solid-codemirror';
import { createEffect } from 'solid-js';

import { store } from '~/store';
import { getCompletion } from '~/store/actions';

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

  createEffect(() => {
    createExtension(placeholder(props.placeholder ?? 'Write something...'));
  });

  createEditorReadonly(editorView, () =>
    props.disabled === undefined ? false : props.disabled,
  );

  createExtension(history());
  createExtension(EditorView.lineWrapping);
  createExtension(keymap.of(defaultKeymap));
  if (store.featureFlags.completions) {
    createExtension(inlineSuggestion({ fetchFn: fetchSuggestion, delay: 1000 }));
  }
  createExtension(
    // this doesn't work without the Prec.highest
    Prec.highest(
      keymap.of([
        // undo/redo
        { key: 'Mod-z', run: undo },
        { key: 'Mod-y', run: redo },
        { key: 'Mod-Shift-z', run: redo },
        // submit
        {
          key: 'Enter',
          run: (view) => {
            if (props.mode === 'note') {
              view.dispatch(view.state.replaceSelection('\n'));
              return true;
            }
            props.onSubmit?.();
            return true;
          },
        },
        // new line on shift enter
        {
          key: 'Shift-Enter',
          run: (view) => {
            if (props.mode === 'note') {
              props.onSubmit?.();
              return true;
            }
            view.dispatch(view.state.replaceSelection('\n'));
            return true;
          },
        },
      ]),
    ),
  );

  // focus the editor when the component is mounted
  const timer = setInterval(() => {
    editorView()?.focus();
    const endPos = editorView()?.state.doc.length;
    editorView()?.dispatch({
      selection: { anchor: endPos },
    });
    if (editorView()?.hasFocus) clearInterval(timer);
  }, 100);

  return <div ref={ref} class={props.class} data-mode={props.mode} />;
}
