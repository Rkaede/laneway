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

const tableContent = `### Summary and Recommendation

| Option | Implementation Effort | Downtime on Deploy | Cost Impact | Scalability | Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Change ECS Deployment** | **Very Low** (Config change) | **Yes** (minutes) | None | Low (1 instance only) | **Good short-term fix** |
| **2. Migrate to RDS/Aurora** | **Medium** (Code + Infra change) | **No** | Medium | **High** | **Best long-term solution** |
| **3. Use SQLite WAL Mode** | Low (Code change) | No | None | Low (1 instance only) | **Not Recommended (Risk of data corruption)** |`;

export function WithTable() {
  return (
    <div class="grid grid-cols-2 gap-4">
      <Message id="with-table-2" role="assistant" content={tableContent} usage={stats} />
    </div>
  );
}

export function WithTableMultiple() {
  return (
    <div class="grid grid-cols-3 gap-4">
      <Message id="with-table-1" role="assistant" content={tableContent} usage={stats} />
      <Message id="with-table-2" role="assistant" content={tableContent} usage={stats} />
      <Message id="with-table-3" role="assistant" content={tableContent} usage={stats} />
    </div>
  );
}
