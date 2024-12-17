import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  SwitchControl,
  SwitchThumb,
  Tag,
} from '~/components/ui';
import { setStore, store } from '~/store';
import { apiKeys } from '~/store/keys';

import { Section, Setting, SettingControl } from './shared';

interface OpenAITTSVoiceOption {
  value: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
  label: string;
}

const voices: OpenAITTSVoiceOption[] = [
  { value: 'alloy', label: 'Alloy' },
  { value: 'echo', label: 'Echo' },
  { value: 'fable', label: 'Fable' },
  { value: 'onyx', label: 'Onyx' },
  { value: 'nova', label: 'Nova' },
  { value: 'shimmer', label: 'Shimmer' },
];

export function TTSSettings() {
  return (
    <Section title="Text to Speech" description="Configure text to speech settings.">
      <Setting
        inline
        title="Enable TTS"
        description={
          <>
            Show the TTS button at the bottom of messages.
            {!apiKeys?.openai && (
              <div class="mt-2">
                <Tag variant="warning">OpenAI API key not configured</Tag>
              </div>
            )}
          </>
        }
      >
        <SettingControl>
          <Switch
            disabled={!apiKeys?.openai}
            checked={store.settings.tts.enabled}
            onChange={(value) => setStore('settings', 'tts', 'enabled', value)}
          >
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
          </Switch>
        </SettingControl>
      </Setting>

      <Setting title="Voice" description={'Select the voice to use for text to speech.'}>
        <Select
          disabled={!store.settings.tts.enabled || !apiKeys?.openai}
          options={voices}
          optionValue="value"
          optionTextValue="label"
          value={voices.find((v) => v.value === store.settings.tts.openai.voice)}
          onChange={(value) =>
            value && setStore('settings', 'tts', 'openai', 'voice', value.value)
          }
          itemComponent={(props) => (
            <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>
          )}
        >
          <SelectTrigger class="w-[200px]">
            <SelectValue<OpenAITTSVoiceOption>>
              {(state) => state.selectedOption().label ?? 'Select option'}
            </SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>
      </Setting>
    </Section>
  );
}
