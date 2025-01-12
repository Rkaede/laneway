import { MultiCombobox } from '~/components/connected/multi-combobox';
import { Switch, SwitchControl, SwitchThumb } from '~/components/ui';
import { setStore, store } from '~/store';

import { Section, Setting, SettingControl } from './shared';

export function GeneralSettings() {
  return (
    <Section title="General" description="General settings for the app.">
      <Setting
        inline
        title="Generate Titles"
        description="On the first message, automatically generate a title. The system model specified below is used."
      >
        <SettingControl>
          <Switch
            checked={store.settings.generateTitles}
            onChange={(value) => setStore('settings', 'generateTitles', value)}
          >
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
          </Switch>
        </SettingControl>
      </Setting>
      <Setting
        title="System Model"
        description="This model is used by the app to generate title for new sessions."
      >
        <MultiCombobox
          value={{ id: store.settings.systemModel, type: 'model' }}
          onSelect={({ referenceId }) => setStore('settings', 'systemModel', referenceId)}
          class="w-1/2"
          includeModels
        />
      </Setting>
      <Setting title="Note Model" description="The default model for new notes.">
        <MultiCombobox
          value={{
            id: store.settings.noteModel.referenceId,
            type: store.settings.noteModel.type,
          }}
          onSelect={({ referenceId, type }) =>
            setStore('settings', 'noteModel', {
              referenceId,
              // todo: the type returned should be narrowed based on the includeModels and
              // includeAssistants
              type: type as 'model' | 'assistant',
            })
          }
          class="w-1/2"
          includeModels
          includeAssistants
        />
      </Setting>
      <Setting title="Default Session" description="The default session for new conversations.">
        <MultiCombobox
          value={{
            id: store.settings.defaultSession.id,
            type: store.settings.defaultSession.type,
          }}
          onSelect={(item) =>
            setStore('settings', 'defaultSession', { id: item.referenceId, type: item.type })
          }
          class="w-1/2"
          includeAssistants
          includeModels
          includePresets
          showType
        />
      </Setting>
    </Section>
  );
}
