import { Message } from '~/components/chat/components';

const exampleUser = 'How old is earth?';
const exampleAssistant =
  'Earth is approximately 4.54 billion years old. This age is based on evidence from radiometric age dating of meteorite material and is consistent with the ages of the oldest-known terrestrial and lunar samples.';
const stats = {
  promptTokens: 150,
  completionTokens: 250,
  totalTokens: 400,
  created: Date.now(),
  timeTaken: 2500,
};

export function Basic() {
  return (
    <div class="flex max-w-md flex-col gap-4">
      <Message id="basic" role="user" content={exampleUser} />
      <Message id="basic" role="assistant" content={exampleAssistant} usage={stats} />
    </div>
  );
}

export function WithTTS() {
  return (
    <div class="max-w-md">
      <Message id="with-tts" role="assistant" content={exampleAssistant} tts usage={stats} />
    </div>
  );
}
