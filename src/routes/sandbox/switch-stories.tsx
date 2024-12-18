import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from '~/components/ui/switch';

import { CellHeader } from './story-components';

export function States() {
  return (
    <div class="grid max-w-md grid-flow-col gap-8 text-sm">
      <div>
        <CellHeader>Default</CellHeader>
        <Switch>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </Switch>
      </div>

      <div>
        <CellHeader>Checked</CellHeader>
        <Switch defaultChecked>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </Switch>
      </div>

      <div>
        <CellHeader>With Label</CellHeader>
        <Switch class="flex items-center">
          <SwitchLabel class="mr-2">Airplane Mode</SwitchLabel>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </Switch>
      </div>

      <div>
        <CellHeader>Disabled</CellHeader>
        <Switch disabled>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </Switch>
      </div>
    </div>
  );
}
