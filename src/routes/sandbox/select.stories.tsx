import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select';

import { Cell, CellHeader, Cells } from './story-components';

const options = ['Light', 'Dark', 'System'];

function Example(props: {
  placeholder?: string;
  defaultValue?: string;
  disabled?: boolean;
  optionDisabled?: (option: string) => boolean;
}) {
  return (
    <Select
      options={options}
      itemComponent={(item) => <SelectItem item={item.item}>{item.item.rawValue}</SelectItem>}
      class="w-full"
      placeholder={props.placeholder}
      defaultValue={props.defaultValue}
      disabled={props.disabled}
      optionDisabled={props.optionDisabled}
    >
      <SelectTrigger>
        <SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
      </SelectTrigger>
      <SelectContent />
    </Select>
  );
}

export function States() {
  return (
    <Cells class="max-w-sm">
      <Cell>
        <CellHeader>Placeholder</CellHeader>
        <Example placeholder="Pick a theme" />
      </Cell>
      <Cell>
        <CellHeader>Selected</CellHeader>
        <Example defaultValue="Dark" />
      </Cell>
      <Cell>
        <CellHeader>Disabled option</CellHeader>
        <Example defaultValue="Light" optionDisabled={(option) => option === 'System'} />
      </Cell>
      <Cell>
        <CellHeader>Disabled</CellHeader>
        <Example defaultValue="Dark" disabled />
      </Cell>
    </Cells>
  );
}
