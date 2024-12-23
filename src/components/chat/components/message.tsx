import { type Component, type ParentComponent, Show } from 'solid-js';
import { SolidMarkdown } from 'solid-markdown';

import { ModelIcon } from '~/components/connected';
import { IconBan, IconUser } from '~/components/icons/ui';
import { Avatar, CodeBlock, Tag } from '~/components/ui';
import { LocalImage } from '~/components/ui/local-image';
import { AudioButton } from '~/components/ui/message/audio-button';
import { CopyButton } from '~/components/ui/message/copy-button';
import { StatsPopover } from '~/components/ui/stats-popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { createAudio } from '~/hooks/use-audio';
import { store } from '~/store/index';
import { apiKeys } from '~/store/keys';
import type { MessageProps, TextPart } from '~/types';
import { cn, sanitizeMessage } from '~/util';

const ModelTitle: ParentComponent = (props) => {
  return (
    <div class="mb-1 flex items-center gap-1 px-1 text-assistant-foreground/80">
      <span class="text-xs font-semibold">{props.children}</span>
    </div>
  );
};

const MarkdownContent: Component<{ text: string }> = (props) => {
  return (
    <SolidMarkdown
      components={{
        pre(preProps) {
          return <pre class="not-prose overflow-hidden rounded" {...preProps} />;
        },
        code(codeProps) {
          return (
            <Show
              when={codeProps.inline === true}
              fallback={
                <CodeBlock
                  code={
                    /* @ts-ignore: this is a depencency bug */
                    codeProps.node.children[0]?.value ?? ''
                  }
                  language={codeProps.class?.split('-')[1] ?? 'plaintext'}
                  {...codeProps}
                />
              }
            >
              <span class="inline-block max-w-full overflow-x-auto align-bottom">
                <span class="mx-[0.2em] inline-block rounded border bg-background/80 px-1 align-baseline font-mono text-sm">
                  {
                    /* @ts-ignore: this is a depencency bug */
                    codeProps.node.children[0]?.value ?? ''
                  }
                </span>
              </span>
            </Show>
          );
        },
      }}
      class={cn(
        'prose dark:prose-invert prose-p:leading-relaxed prose-pre:m-0 prose-pre:rounded-none prose-pre:p-0 prose-pre:leading-snug',
      )}
    >
      {sanitizeMessage(props.text)}
    </SolidMarkdown>
  );
};

export const Message: Component<MessageProps & { tts?: boolean; copy?: boolean }> = (props) => {
  const content = () =>
    typeof props.content === 'string'
      ? props.content
      : props.content
          .filter((p) => p.type === 'text')
          .map((p) => (p as TextPart).text)
          .join('\n');

  const audio = createAudio({
    id: props.id,
    text: content(),
  });

  function handleClickTTS() {
    if (audio.status() === 'playing') {
      audio.stop();
    }
    if (audio.status() === 'idle') {
      audio.play();
    }
  }

  return (
    <MessageContainer role={props.role} content={props.content} id={props.id}>
      <Show
        when={store.settings.messages.showAvatars}
        fallback={
          props.role === 'assistant' &&
          store.settings.messages.showModelTitle && (
            <ModelTitle>{props.model?.title}</ModelTitle>
          )
        }
      >
        <Avatar>
          <Show
            when={props.role === 'user'}
            fallback={<ModelIcon class="size-5" modelId={props.model?.id} />}
          >
            <IconUser />
          </Show>
        </Avatar>
      </Show>
      <div class="flex-1 space-y-2 px-1">
        {Array.isArray(props.content) ? (
          props.content
            .sort((a, b) => (a.type === 'image' ? 1 : b.type === 'image' ? -1 : 0))
            .map((part) => {
              if (part.type === 'text') {
                return <MarkdownContent text={part.text} />;
              }
              if (part.type === 'image') {
                return <LocalImage src={part.image.storageId} />;
              }
              return `Unknown part type: ${JSON.stringify(part)}`;
            })
        ) : (
          <MarkdownContent text={props.content} />
        )}
      </div>
      <Show when={props.cancelled}>
        <Tag variant="secondary" class="my-2">
          <IconBan class="size-3" />
          Full response cancelled by user
        </Tag>
      </Show>
      <Show when={props.role === 'assistant'}>
        <div class="mt-2 flex items-center gap-[1px]">
          <Show when={props.tts}>
            <Show
              when={apiKeys.openai === '' || apiKeys.openai === undefined}
              fallback={
                <AudioButton status={audio.status()} onClick={() => handleClickTTS()} />
              }
            >
              <Tooltip>
                <TooltipTrigger class="cursor-default">
                  <AudioButton status="unavailable" onClick={() => handleClickTTS()} />
                </TooltipTrigger>
                <TooltipContent>
                  {apiKeys.openai ? '' : 'OpenAI API key is required'}
                </TooltipContent>
              </Tooltip>
            </Show>
          </Show>
          <CopyButton text={content()} />
          <StatsPopover stats={props.usage} />
        </div>
      </Show>
    </MessageContainer>
  );
};

const MessageContainer: ParentComponent<MessageProps> = (props) => {
  return (
    <div
      class="max-w-full rounded-xl px-4 py-2.5"
      classList={{
        'gap-2 flex items-start': store.settings.messages.showAvatars,
        'self-start bg-assistant text-assistant-foreground': props.role === 'assistant',
        'self-end bg-user text-user-foreground': props.role === 'user',
      }}
    >
      {props.children}
    </div>
  );
};
