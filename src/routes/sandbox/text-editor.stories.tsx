import { createSignal } from 'solid-js';

import TextEditor from '~/components/ui/text-editor/text-editor';

import { Cell, CellHeader, Cells } from './story-components';

const frame = 'w-full rounded-md border px-3 py-2';

export function Modes() {
  return (
    <Cells class="max-w-md">
      <Cell>
        <CellHeader>Chat (Enter sends)</CellHeader>
        <TextEditor class={frame} mode="chat" />
      </Cell>
      <Cell>
        <CellHeader>Note (Enter adds a line)</CellHeader>
        <TextEditor class={frame} mode="note" />
      </Cell>
    </Cells>
  );
}

export function Content() {
  return (
    <Cells class="max-w-md">
      <Cell>
        <CellHeader>Custom placeholder</CellHeader>
        <TextEditor class={frame} placeholder="Ask anything..." />
      </Cell>
      <Cell>
        <CellHeader>Initial value</CellHeader>
        <TextEditor class={frame} initialValue={'Two lines\nof text'} />
      </Cell>
      <Cell>
        <CellHeader>Disabled</CellHeader>
        <TextEditor class={frame} initialValue="Cannot edit" disabled />
      </Cell>
    </Cells>
  );
}

export function Controlled() {
  const [value, setValue] = createSignal('Cleared when sent');
  const [sent, setSent] = createSignal('');

  return (
    <Cells class="max-w-md">
      <Cell>
        <CellHeader>Press Enter to send</CellHeader>
        <TextEditor
          class={frame}
          initialValue={value()}
          onInput={setValue}
          onSubmit={() => {
            setSent(value());
            setValue('');
          }}
        />
        <p class="text-sm text-muted">Last sent: {sent() || 'nothing yet'}</p>
      </Cell>
    </Cells>
  );
}
