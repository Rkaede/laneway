import { createMemo, onMount, Show } from 'solid-js';

import { IconLoaderCircle, IconSpeaker, IconSquare } from '~/components/icons/ui';
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
import { Button } from '~/components/ui/button';
import { createAudio } from '~/hooks/use-audio';
import { setStore, store } from '~/store';
import { anyKeysSet } from '~/store/selectors';
import { loadSpeechModels, speechModels } from '~/store/speech-models';
import type { SpeechModel } from '~/types';

import { Section, Setting, SettingControl } from './shared';

const PREVIEW_TEXT = 'Hi there. This is how replies will sound when you listen to them.';

function formatPrice(price: number) {
  if (price === 0) return 'Free';
  return `$${(price * 1_000_000).toFixed(2)} per 1M characters`;
}

export function TTSSettings() {
  onMount(loadSpeechModels);

  const model = createMemo(() =>
    speechModels()?.find((m) => m.id === store.settings.tts.model),
  );
  const voices = () => model()?.voices ?? [];
  const disabled = () => !anyKeysSet() || !store.settings.tts.enabled;
  const preview = createAudio({ id: 'tts-preview', text: PREVIEW_TEXT });

  function handleModelChange(next: SpeechModel | null) {
    if (!next) return;
    preview.stop();
    setStore('settings', 'tts', 'model', next.id);
    // Voices belong to a model, so keep the current one only if the new model has it.
    if (!next.voices.includes(store.settings.tts.voice)) {
      setStore('settings', 'tts', 'voice', next.voices[0] ?? '');
    }
  }

  function handleVoiceChange(voice: string | null) {
    if (!voice) return;
    preview.stop();
    setStore('settings', 'tts', 'voice', voice);
  }

  function handlePreview() {
    if (preview.status() === 'playing' || preview.status() === 'loading') {
      preview.stop();
      return;
    }
    void preview.play();
  }

  return (
    <Section
      title="Text to Speech"
      description="Listen to replies with a speech model on OpenRouter."
    >
      <Setting
        inline
        title="Enable TTS"
        description={
          <>
            Show the TTS button at the bottom of messages.
            <Show when={!anyKeysSet()}>
              <div class="mt-2">
                <Tag variant="warning">OpenRouter API key not configured</Tag>
              </div>
            </Show>
          </>
        }
      >
        <SettingControl>
          <Switch
            disabled={!anyKeysSet()}
            checked={anyKeysSet() && store.settings.tts.enabled}
            onChange={(value) => setStore('settings', 'tts', 'enabled', value)}
          >
            <SwitchControl>
              <SwitchThumb />
            </SwitchControl>
          </Switch>
        </SettingControl>
      </Setting>

      <Setting title="Model" description="Prices are OpenRouter's, per character read aloud.">
        <Select<SpeechModel>
          disabled={disabled() || !speechModels()}
          options={speechModels() ?? []}
          optionValue="id"
          optionTextValue="title"
          value={model() ?? null}
          onChange={handleModelChange}
          placeholder={speechModels() ? store.settings.tts.model : 'Loading models…'}
          itemComponent={(props) => (
            <SelectItem item={props.item}>
              <span class="flex w-full items-baseline justify-between gap-4">
                <span>{props.item.rawValue.title}</span>
                <span class="text-xs text-muted">{formatPrice(props.item.rawValue.price)}</span>
              </span>
            </SelectItem>
          )}
        >
          <SelectTrigger aria-label="Speech model" class="w-full max-w-md">
            <SelectValue<SpeechModel>>{(state) => state.selectedOption().title}</SelectValue>
          </SelectTrigger>
          <SelectContent class="max-h-72 overflow-y-auto" />
        </Select>
      </Setting>

      <Setting title="Voice" description="Voices depend on the model.">
        <div class="flex flex-wrap items-center gap-2">
          <Select<string>
            class="w-full max-w-xs"
            disabled={disabled() || voices().length === 0}
            options={voices()}
            value={store.settings.tts.voice || null}
            onChange={handleVoiceChange}
            placeholder="Select a voice"
            itemComponent={(props) => (
              <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>
            )}
          >
            <SelectTrigger aria-label="Voice" class="w-full max-w-xs">
              <SelectValue<string>>{(state) => state.selectedOption()}</SelectValue>
            </SelectTrigger>
            <SelectContent class="max-h-72 overflow-y-auto" />
          </Select>
          <Button
            variant="outline"
            disabled={disabled() || !store.settings.tts.voice}
            onClick={handlePreview}
          >
            <Show
              when={preview.status() === 'loading'}
              fallback={
                <Show when={preview.status() === 'playing'} fallback={<IconSpeaker />}>
                  <IconSquare class="size-3" fill="currentColor" />
                </Show>
              }
            >
              <IconLoaderCircle class="animate-spin motion-reduce:animate-none" />
            </Show>
            {preview.status() === 'playing' ? 'Stop' : 'Preview'}
          </Button>
        </div>
        <Show when={preview.status() === 'error'}>
          <p role="alert" class="mt-2 text-sm text-danger">
            The preview did not play. Check your OpenRouter key, or try another model or voice.
          </p>
        </Show>
      </Setting>
    </Section>
  );
}
