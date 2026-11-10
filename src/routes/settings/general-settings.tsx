import { MultiCombobox } from '~/components/connected/multi-combobox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  SwitchControl,
  SwitchLabel,
  SwitchThumb,
} from '~/components/ui';
import {
  getStreamCursor,
  getStreamDisplayMode,
  getTheme,
  STREAM_CURSORS,
  STREAM_DISPLAY_MODES,
  THEMES,
} from '~/constants';
import { setStore, store } from '~/store';

import { Section, Setting, SettingControl } from './shared';

export function GeneralSettings() {
  return (
    <Section title="General" description="General settings for the app.">
      <Setting title="Theme" description="The colour theme used across the app.">
        <Select
          options={[...THEMES]}
          optionValue="id"
          optionTextValue="label"
          value={getTheme(store.settings.theme)}
          onChange={(value) => value && setStore('settings', 'theme', value.id)}
          itemComponent={(props) => (
            <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>
          )}
        >
          <SelectTrigger aria-label="Theme" class="w-1/2">
            <SelectValue<(typeof THEMES)[number]>>
              {(state) => state.selectedOption().label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>
      </Setting>
      <Setting
        title="Streaming Display"
        description="How an answer appears while it is written."
      >
        <Select
          options={[...STREAM_DISPLAY_MODES]}
          optionValue="id"
          optionTextValue="label"
          value={getStreamDisplayMode(store.settings.streaming.display)}
          onChange={(value) => value && setStore('settings', 'streaming', 'display', value.id)}
          itemComponent={(props) => (
            <SelectItem item={props.item}>
              {props.item.rawValue.label}
              <span class="ml-2 text-xs text-muted">{props.item.rawValue.description}</span>
            </SelectItem>
          )}
        >
          <SelectTrigger class="w-1/2">
            <SelectValue<(typeof STREAM_DISPLAY_MODES)[number]>>
              {(state) => state.selectedOption().label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>
      </Setting>
      <Setting
        title="Streaming Cursor"
        description="What marks the spot where an answer is about to appear."
      >
        <Select
          options={[...STREAM_CURSORS]}
          optionValue="id"
          optionTextValue="label"
          value={getStreamCursor(store.settings.streaming.cursor)}
          onChange={(value) => value && setStore('settings', 'streaming', 'cursor', value.id)}
          itemComponent={(props) => (
            <SelectItem item={props.item}>
              {props.item.rawValue.label}
              <span class="ml-2 text-xs text-muted">{props.item.rawValue.description}</span>
            </SelectItem>
          )}
        >
          <SelectTrigger aria-label="Streaming Cursor" class="w-1/2">
            <SelectValue<(typeof STREAM_CURSORS)[number]>>
              {(state) => state.selectedOption().label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>
      </Setting>
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
            <SwitchLabel class="sr-only">Generate Titles</SwitchLabel>
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
          </Switch>
        </SettingControl>
      </Setting>
      <Setting
        title="System Model"
        description="This model is used by the app to generate titles for new sessions."
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
      <Setting
        title="Default Chat"
        description="The model, assistant, or preset for new chats."
      >
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
