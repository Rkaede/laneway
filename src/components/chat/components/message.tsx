import { type Component, type ParentComponent, Show } from 'solid-js';
import { SolidMarkdown } from 'solid-markdown';

import { ModelIcon } from '~/components/connected';
import { IconUser } from '~/components/icons/ui';
import { Avatar, CodeBlock } from '~/components/ui';
import { LocalImage } from '~/components/ui/local-image';
import { store } from '~/store/index';
import type { MessageProps } from '~/types';
import { cn } from '~/util';

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
              <span class="mx-[0.2em] inline-block rounded border border-background-4 bg-background-2 px-1 font-mono text-sm">
                {
                  /* @ts-ignore: this is a depencency bug */
                  codeProps.node.children[0]?.value ?? ''
                }
              </span>
            </Show>
          );
        },
      }}
      class={cn(
        'prose prose-p:leading-relaxed prose-pre:m-0 prose-pre:rounded-none prose-pre:p-0 prose-pre:leading-snug',
        store.settings.theme === 'dark' && 'prose-invert',
      )}
    >
      {props.text}
    </SolidMarkdown>
  );
};

export const Message: Component<MessageProps> = (props) => {
  return (
    <MessageContainer role={props.role} content={props.content}>
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
      <div class="flex-1 space-y-2 overflow-hidden px-1">
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
    </MessageContainer>
  );
};

const MessageContainer: ParentComponent<MessageProps> = (props) => {
  return (
    <div
      class="mx-1.5 rounded-xl p-2"
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
