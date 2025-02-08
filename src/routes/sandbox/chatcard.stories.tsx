import { SpeedDialOption } from '~/components/connected';
import { Avatar, AvatarGroup } from '~/components/ui';

export function Default() {
  return (
    <div class="inline-grid grid-flow-col gap-4">
      <SpeedDialOption title="GPT-4" subtitle="OpenAI" tags={['model']} sessionType="chat" />
      <SpeedDialOption
        title="Claude 3 Sonnet"
        subtitle="Anthropic"
        tags={['model']}
        sessionType="chat"
      />
      <SpeedDialOption
        title="My Assistant"
        subtitle="Custom assistant for coding"
        tags={['assistant']}
        sessionType="chat"
      >
        <AvatarGroup>
          <Avatar modelId="openai/gpt-4o" size="sm" />
          <Avatar modelId="anthropic/claude-3.5-sonnet" size="sm" />
          <Avatar modelId="google/gemini-flash-1.5" size="sm" />
        </AvatarGroup>
      </SpeedDialOption>
    </div>
  );
}

export function Notes() {
  return (
    <div class="flex gap-4">
      <SpeedDialOption
        title="Meeting Notes"
        subtitle="Template for meeting notes"
        tags={['preset']}
        sessionType="note"
      />
      <SpeedDialOption
        title="Daily Journal"
        subtitle="Template for daily journaling"
        tags={['preset']}
        sessionType="note"
      />
    </div>
  );
}

export function AllTypes() {
  return (
    <div class="flex gap-4">
      <SpeedDialOption title="GPT-4" subtitle="OpenAI" tags={['model']} sessionType="chat" />
      <SpeedDialOption
        title="Research Assistant"
        subtitle="Specialized in academic research"
        tags={['assistant']}
        sessionType="chat"
      />
      <SpeedDialOption
        title="Blog Post"
        subtitle="Blog post template"
        tags={['preset']}
        sessionType="note"
      />
    </div>
  );
}
