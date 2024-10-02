// todo: we should be using own own text field?
import { TextField } from '@kobalte/core/text-field';
import { cva } from 'class-variance-authority';
import { type Component, Show } from 'solid-js';

import {
  FormContainer,
  Input,
  SettingDescription,
  SettingTitle,
  Slider,
  SliderFill,
  SliderLabel,
  SliderThumb,
  SliderTrack,
  SliderValueLabel,
  SplitColumns,
  TextArea,
} from '~/components/ui';
import type { ProviderId } from '~/types';

import { MultiCombobox } from './multi-combobox';

const slider = cva('grid grid-cols-[130px_1fr_50px] gap-3');

// placeholder UI - functionality to be added at a later date
const enableSliders = false;

type ChatSettingsProps = {
  name: string;
  subtitle?: string;
  modelId?: string;
  providerId?: ProviderId;
  systemPrompt: string;
  onNameChange: (name: string) => void;
  onSubtitleChange: (subtitle: string) => void;
  onModelChange: (modelId: string) => void;
  onProviderChange: (providerId: string) => void;
  onSystemPromptChange: (systemPrompt: string) => void;
};

export const ChatSettings: Component<ChatSettingsProps> = (props) => {
  return (
    <FormContainer>
      <SplitColumns>
        <div>
          <SettingTitle>Name</SettingTitle>
          <Input
            value={props.name}
            onInput={(e) => props.onNameChange((e.currentTarget as HTMLInputElement).value)}
          />
        </div>
        <div>
          <SettingTitle>Subtitle</SettingTitle>
          <Input
            value={props.subtitle}
            onInput={(e) => props.onSubtitleChange((e.currentTarget as HTMLInputElement).value)}
          />
        </div>
      </SplitColumns>
      <SplitColumns>
        <div>
          <SettingTitle>Model</SettingTitle>
          <MultiCombobox
            includeModels
            value={{ id: props.modelId, type: 'model' }}
            onSelect={({ referenceId }) => props.onModelChange(referenceId)}
          />
        </div>
      </SplitColumns>

      <div>
        <SettingTitle>System Prompt</SettingTitle>
        <SettingDescription>Leave blank to use the models default.</SettingDescription>
        <TextField>
          <TextArea
            class="resize-none"
            placeholder="You are a helpful assistant."
            rows="6"
            value={props.systemPrompt}
            onInput={(e) =>
              props.onSystemPromptChange((e.currentTarget as HTMLTextAreaElement).value)
            }
          />
        </TextField>
      </div>

      <Show when={enableSliders}>
        <div class="grid grid-cols-2 gap-4">
          <Slider
            minValue={10}
            maxValue={3000}
            defaultValue={[3000]}
            getValueLabel={(params) => `${params.values[0]}`}
            class={slider()}
          >
            <SliderLabel>Max Tokens</SliderLabel>
            <SliderTrack>
              <SliderFill />
              <SliderThumb />
            </SliderTrack>
            <SliderValueLabel />
          </Slider>

          <Slider
            minValue={0}
            maxValue={2}
            defaultValue={[1]}
            step={0.01}
            getValueLabel={(params) => `${params.values[0]}`}
            class={slider()}
          >
            <SliderLabel>Temperature</SliderLabel>
            <SliderTrack>
              <SliderFill />
              <SliderThumb />
            </SliderTrack>
            <SliderValueLabel />
          </Slider>
        </div>
      </Show>

      <Show when={enableSliders}>
        <div class="grid grid-cols-2 gap-4">
          <Slider
            minValue={0}
            maxValue={2}
            step={0.01}
            defaultValue={[1]}
            getValueLabel={(params) => `${params.values[0]}`}
            class={slider()}
          >
            <SliderLabel>Frequency Penalty</SliderLabel>
            <SliderTrack>
              <SliderFill />
              <SliderThumb />
            </SliderTrack>
            <SliderValueLabel />
          </Slider>
          <Slider
            minValue={0}
            maxValue={2}
            step={0.01}
            defaultValue={[1]}
            getValueLabel={(params) => `${params.values[0]}`}
            class={slider()}
          >
            <SliderLabel>Presence Penalty</SliderLabel>
            <SliderTrack>
              <SliderFill />
              <SliderThumb />
            </SliderTrack>
            <SliderValueLabel />
          </Slider>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <Slider
            minValue={0}
            maxValue={1}
            defaultValue={[1]}
            step={0.01}
            getValueLabel={(params) => `${params.values[0]}`}
            class={slider()}
          >
            <SliderLabel>Top P</SliderLabel>
            <SliderTrack>
              <SliderFill />
              <SliderThumb />
            </SliderTrack>
            <SliderValueLabel />
          </Slider>
        </div>
      </Show>
    </FormContainer>
  );
};
