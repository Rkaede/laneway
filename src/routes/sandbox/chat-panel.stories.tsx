import { ChatPanel } from '~/components/chat/chat-panel';
import type { ChatProps, MessageProps } from '~/types';

import { MODEL_IDS, sampleImageFile } from './story-fixtures';

const question: MessageProps = {
  id: 'story-question',
  role: 'user',
  content: 'What is compound interest?',
};

const answer: MessageProps = {
  id: 'story-answer',
  role: 'assistant',
  content: 'Interest earned on both the original amount and the interest added so far.',
  usage: { promptTokens: 12, completionTokens: 18, totalTokens: 30, timeTaken: 1200 },
};

function storyChat(overrides: Partial<ChatProps>): ChatProps {
  return {
    id: 'story-chat',
    messages: [question],
    status: 'idle',
    modelId: MODEL_IDS.openai,
    ...overrides,
  };
}

// isExample keeps the panel read-only, so a story never sends a request to the model.
function Panel(props: { chat: ChatProps; attachments?: File[]; variant?: 'chat' | 'note' }) {
  return (
    <div class="flex max-w-[70ch]">
      <ChatPanel
        sessionId="story-session"
        isExample
        chat={props.chat}
        attachments={props.attachments}
        variant={props.variant}
      />
    </div>
  );
}

export function Conversation() {
  return <Panel chat={storyChat({ messages: [question, answer] })} />;
}

export function Empty() {
  return <Panel chat={storyChat({ messages: [] })} />;
}

export function Waiting() {
  return <Panel chat={storyChat({ status: 'loading' })} />;
}

export function Streaming() {
  return (
    <Panel
      chat={storyChat({
        status: 'loading',
        latest: { id: 'story-latest', role: 'assistant', content: 'Interest earned on both' },
      })}
    />
  );
}

export function Failed() {
  return (
    <Panel
      chat={storyChat({
        status: 'error',
        error: { name: 'APIError', message: 'The provider returned a 500 error.' },
      })}
    />
  );
}

export function ImageWithoutVision() {
  return (
    <Panel
      chat={storyChat({ modelId: MODEL_IDS.noVision })}
      attachments={[sampleImageFile('Photo')]}
    />
  );
}

export function NoteVariant() {
  return <Panel variant="note" chat={storyChat({ messages: [question, answer] })} />;
}
