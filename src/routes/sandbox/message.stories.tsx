import { Message } from '~/components/chat/components';

export function Basic() {
  return (
    <div class="max-w-md">
      <Message id="basic" role="user" content="Hello, how are you?" />
    </div>
  );
}

export function WithTTS() {
  return (
    <div class="max-w-md">
      <Message id="with-tts" role="user" content="Hello, how are you?" tts />
    </div>
  );
}
