// todo: we should be using own own text field?
import { TextField } from '@kobalte/core/text-field';
import type { Component } from 'solid-js';

import {
  FormContainer,
  Input,
  SettingDescription,
  SettingTitle,
  SplitColumns,
  TextArea,
} from '~/components/ui';

import { MultiCombobox } from './multi-combobox';

type ChatSettingsProps = {
  name: string;
  subtitle?: string;
  modelId?: string;
  systemPrompt: string;
  onNameChange: (name: string) => void;
  onSubtitleChange: (subtitle: string) => void;
  onModelChange: (modelId: string) => void;
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
          <SettingTitle>Description</SettingTitle>
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
        <SettingDescription>Leave blank to use the model's default.</SettingDescription>
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
    </FormContainer>
  );
};
