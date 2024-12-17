import { Switch, SwitchControl, SwitchLabel, SwitchThumb } from '~/components/ui/switch';

export function States() {
  return (
    <div class="grid max-w-md grid-flow-col gap-8 text-sm">
      <div>
        <div>Default</div>
        <Switch>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </Switch>
      </div>

      <div>
        <div>Checked</div>
        <Switch defaultChecked>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </Switch>
      </div>

      <div>
        <div>With Label</div>
        <Switch>
          <SwitchLabel class="mr-2">Airplane Mode</SwitchLabel>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </Switch>
      </div>

      <div>
        <div>Disabled</div>
        <Switch disabled>
          <SwitchControl>
            <SwitchThumb />
          </SwitchControl>
        </Switch>
      </div>
    </div>
  );
}
