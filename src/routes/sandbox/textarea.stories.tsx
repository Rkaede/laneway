import { TextField } from '@kobalte/core/text-field';

import { TextArea } from '~/components/ui/textarea';

import { Cell, CellHeader, Cells } from './story-components';

export function States() {
  return (
    <Cells class="max-w-md">
      <Cell>
        <CellHeader>Empty</CellHeader>
        <TextField class="w-full">
          <TextArea />
        </TextField>
      </Cell>
      <Cell>
        <CellHeader>Placeholder</CellHeader>
        <TextField class="w-full">
          <TextArea placeholder="You are a helpful assistant." />
        </TextField>
      </Cell>
      <Cell>
        <CellHeader>With value</CellHeader>
        <TextField class="w-full" defaultValue="You are a concise assistant.">
          <TextArea />
        </TextField>
      </Cell>
      <Cell>
        <CellHeader>Disabled</CellHeader>
        <TextField class="w-full" defaultValue="Cannot edit" disabled>
          <TextArea />
        </TextField>
      </Cell>
      <Cell>
        <CellHeader>Invalid</CellHeader>
        <TextField class="w-full" defaultValue="Not valid" validationState="invalid">
          <TextArea />
        </TextField>
      </Cell>
    </Cells>
  );
}

export function Sizes() {
  return (
    <Cells class="max-w-md">
      <Cell>
        <CellHeader>Six rows, not resizable</CellHeader>
        <TextField class="w-full">
          <TextArea rows="6" class="resize-none" />
        </TextField>
      </Cell>
    </Cells>
  );
}
