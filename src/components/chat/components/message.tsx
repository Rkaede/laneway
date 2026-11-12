import { type Component, splitProps } from 'solid-js';

import { createAudio } from '~/hooks/use-audio';
import { store } from '~/store/index';
import { anyKeysSet } from '~/store/selectors';
import type { MessageProps } from '~/types';

import { messageText, MessageView, type MessageViewProps } from './message-view';

type MessageComponentProps = MessageProps &
  Pick<MessageViewProps, 'wordSpans' | 'cursor' | 'onFork'> & { tts?: boolean };

export const Message: Component<MessageComponentProps> = (props) => {
  const [local, rest] = splitProps(props, ['tts']);

  const audio = createAudio({
    id: props.id,
    text: () => messageText(props.content),
  });

  function handleClickTTS() {
    if (audio.status() === 'playing') {
      audio.stop();
    } else if (audio.status() === 'idle' || audio.status() === 'error') {
      audio.play();
    }
  }

  function audioStatus() {
    if (!local.tts) return undefined;
    return anyKeysSet() ? audio.status() : 'unavailable';
  }

  return (
    <MessageView
      {...rest}
      showAvatars={store.settings.messages.showAvatars}
      showModelTitle={store.settings.messages.showModelTitle}
      audioStatus={audioStatus()}
      onAudioClick={handleClickTTS}
    />
  );
};
