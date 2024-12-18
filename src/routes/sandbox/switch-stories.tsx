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
