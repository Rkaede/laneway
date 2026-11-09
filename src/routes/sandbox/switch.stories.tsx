import { createSignal } from 'solid-js';

import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from '~/components/ui/switch';

import { Cell, CellHeader, Cells } from './story-components';

export function States() {
  return (
    <Cells>
      <Cell>
        <CellHeader>Default</CellHeader>
        <Switch>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </Switch>
      </Cell>

      <Cell>
        <CellHeader>Checked</CellHeader>
        <Switch defaultChecked>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </Switch>
      </Cell>

      <Cell>
        <CellHeader>Disabled</CellHeader>
        <Switch disabled>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </Switch>
      </Cell>

      <Cell>
        <CellHeader>Checked and disabled</CellHeader>
        <Switch defaultChecked disabled>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </Switch>
      </Cell>

      <Cell>
        <CellHeader>With Label</CellHeader>
        <Switch class="flex items-center">
          <SwitchLabel class="mr-2">Airplane Mode</SwitchLabel>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </Switch>
      </Cell>
    </Cells>
  );
}

export function Controlled() {
  const [checked, setChecked] = createSignal(false);

  return (
    <Cells>
      <Cell>
        <CellHeader>{checked() ? 'On' : 'Off'}</CellHeader>
        <Switch checked={checked()} onChange={setChecked}>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </Switch>
      </Cell>
    </Cells>
  );
}
