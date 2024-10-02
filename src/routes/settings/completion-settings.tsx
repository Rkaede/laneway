import { MultiCombobox } from '~/components/connected/multi-combobox';
import { Switch, SwitchControl, SwitchThumb, Tag } from '~/components/ui';
import { setStore, store } from '~/store';

import { Section, Setting, SettingControl } from './shared';

export function Completions() {
  return (
    <Section
      title={
        <>
          Completions <Tag variant="warning">Experimental</Tag>
        </>
      }
      description="Provides completion suggestions in the chat input field. This is an experimental feature. Please report any issues you encounter."
    >
      <Setting
        inline
        title="Enable Completions"
        description="Enable or disable completions in the chat input field."
      >
        <SettingControl>
          <Switch
            checked={store.settings.completions.enabled}
            onChange={(value) => setStore('settings', 'completions', 'enabled', value)}
          >
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
          </Switch>
        </SettingControl>
      </Setting>
      <Setting
        title="Completion Model"
        description="This model is used to generate completions in the chat input field."
      >
        <MultiCombobox
          value={{ id: store.settings.completions.model, type: 'model' }}
          onSelect={({ referenceId }) =>
            setStore('settings', 'completions', 'model', referenceId)
          }
          class="w-1/2"
          includeModels
        />
      </Setting>
    </Section>
  );
}
