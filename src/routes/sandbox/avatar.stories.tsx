import { ModelIcon } from '~/components/connected';
import { Avatar, AvatarGroup } from '~/components/ui';

export function Default() {
  return (
    <div class="flex gap-2">
      <Avatar>
        <ModelIcon class="size-5" modelId="openai/gpt-4o" />
      </Avatar>
      <Avatar>
        <ModelIcon class="size-5" modelId="google/gemini-flash-1.5" />
      </Avatar>
      <Avatar>
        <ModelIcon class="size-5" modelId="anthropic/claude-3.5-sonnet" />
      </Avatar>
    </div>
  );
}

export function Group() {
  return (
    <AvatarGroup>
      <Avatar>
        <ModelIcon class="size-5" modelId="openai/gpt-4o" />
      </Avatar>
      <Avatar>
        <ModelIcon class="size-5" modelId="google/gemini-flash-1.5" />
      </Avatar>
      <Avatar>
        <ModelIcon class="size-5" modelId="anthropic/claude-3.5-sonnet" />
      </Avatar>
    </AvatarGroup>
  );
}
