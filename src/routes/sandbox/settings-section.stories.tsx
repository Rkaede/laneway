import { Input } from '~/components/ui/input';
import { Switch, SwitchControl, SwitchThumb } from '~/components/ui/switch';
import { Section, Setting, SettingControl } from '~/routes/settings/shared';

function Toggle() {
  return (
    <Switch defaultChecked>
      <SwitchControl>
        <SwitchThumb />
      </SwitchControl>
    </Switch>
  );
}

export function Default() {
  return (
    <Section title="General" description="Options that apply to the whole app.">
      <Setting inline title="Inline" description="The control sits beside the text.">
        <SettingControl>
          <Toggle />
        </SettingControl>
      </Setting>
      <Setting title="Stacked" description="The control sits under the text.">
        <Input placeholder="A wider control" />
      </Setting>
      <Setting inline title="No description">
        <SettingControl>
          <Toggle />
        </SettingControl>
      </Setting>
    </Section>
  );
}
