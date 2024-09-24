import './text-editor.css';

import { defaultKeymap, history, redo, undo } from '@codemirror/commands';
import { EditorState, Prec } from '@codemirror/state';
import { EditorView, keymap, placeholder } from '@codemirror/view';
import { inlineSuggestion } from 'codemirror-extension-inline-suggestion';
import { createCodeMirror } from 'solid-codemirror';

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
};

export function TextEditor(props: TextEditorProps) {
  const { editorView, ref, createExtension } = createCodeMirror({
    onValueChange: (value) => {
      props.onInput?.(value);
    },
    value: props.initialValue ?? '',
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
  createExtension(placeholder('Write something...'));
  createExtension(history());
  createExtension(EditorView.lineWrapping);
  createExtension(keymap.of(defaultKeymap));
  createExtension(inlineSuggestion({ fetchFn: fetchSuggestion, delay: 1000 }));
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
          run: () => {
            props.onSubmit?.();
            return true;
          },
        },
        // new line on shift enter
        {
          key: 'Shift-Enter',
          run: (view) => {
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

  return <div ref={ref} />;
}