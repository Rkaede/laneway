import { type Component, createSignal, type ParentComponent, Show } from 'solid-js';

import { ModelIcon } from '~/components/connected/model-icon';
import { IconBan, IconUser } from '~/components/icons/ui';
import { Avatar, Tag } from '~/components/ui';
import { Lightbox } from '~/components/ui/lightbox/lightbox';
import { LocalImage } from '~/components/ui/local-image';
import Markdown from '~/components/ui/markdown';
import type { StreamCursorShape } from '~/components/ui/markdown-cursor';
import { AudioButton, type AudioButtonProps } from '~/components/ui/message/audio-button';
import { CopyButton } from '~/components/ui/message/copy-button';
import { StatsPopover } from '~/components/ui/stats-popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import type { ImagePart, MessageProps, TextPart } from '~/types';
import { cn } from '~/util';

const ModelTitle: ParentComponent = (props) => {
  return (
    <div class="mb-1 flex items-center gap-1 px-1 text-agent-fg/80">
      <span class="text-xs font-semibold">{props.children}</span>
    </div>
  );
};

export type MessageViewProps = MessageProps & {
  showAvatars?: boolean;
  showModelTitle?: boolean;
  /** Leave this out to hide the audio button. */
  audioStatus?: AudioButtonProps['status'];
  onAudioClick?: () => void;
  /** Puts each word of the text in its own span, so a streaming answer can animate them. */
  wordSpans?: boolean;
  /** Shows a cursor after the last text, for an answer that is still streaming. */
  cursor?: StreamCursorShape;
};

/** The plain text of a message, without its images. */
export function messageText(content: MessageProps['content']) {
  return typeof content === 'string'
    ? content
    : content
        .filter((p) => p.type === 'text')
        .map((p) => (p as TextPart).text)
        .join('\n');
}

export const MessageView: Component<MessageViewProps> = (props) => {
  const [lightboxOpen, setLightboxOpen] = createSignal(false);
  const [lightboxIndex, setLightboxIndex] = createSignal(0);
  const [lightboxImages, setLightboxImages] = createSignal<
    Array<{
      storageId: string;
      sourceType?: 'store' | 'path';
      src: string;
      alt: string;
      width: number;
      height: number;
    }>
  >([]);

  const handleImageClick = (_imagePart: ImagePart, index: number) => {
    // Filter out all image parts to create an array for the lightbox
    if (Array.isArray(props.content)) {
      const images = props.content
        .filter((part): part is ImagePart => part.type === 'image')
        .map((part) => ({
          storageId: part.image.storageId,
          sourceType: part.image.sourceType,
          src: part.image.storageId, // Fallback for compatibility with Lightbox
          alt: part.image.filename || 'Image',
          width: 800, // Default width
          height: 600, // Default height
        }));

      setLightboxImages(images);
      setLightboxIndex(index);
      setLightboxOpen(true);
    }
  };

  return (
    <MessageContainer id={props.id} role={props.role} showAvatars={props.showAvatars}>
      <Show when={lightboxOpen()}>
        <Lightbox
          images={lightboxImages()}
          initialIndex={lightboxIndex()}
          open={lightboxOpen()}
          onClose={() => setLightboxOpen(false)}
        />
      </Show>
      <Show
        when={props.showAvatars}
        fallback={
          props.role === 'assistant' &&
          props.showModelTitle && <ModelTitle>{props.model?.title}</ModelTitle>
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
          [...props.content]
            .sort((a, b) => (a.type === 'image' ? 1 : b.type === 'image' ? -1 : 0))
            .map((part) => {
              if (part.type === 'text') {
                return <Markdown text={part.text} />;
              }
              if (part.type === 'image') {
                // Calculate the index of this image among all images
                let imageIndex = 0;
                if (Array.isArray(props.content)) {
                  const imageArray = props.content.filter(
                    (p): p is ImagePart => p.type === 'image',
                  );
                  imageIndex = imageArray.findIndex(
                    (p) => p.image.storageId === part.image.storageId,
                  );
                }

                return (
                  <LocalImage
                    src={part.image.storageId}
                    alt={part.image.filename}
                    sourceType={part.image.sourceType}
                    onClick={() => handleImageClick(part, imageIndex)}
                    class={cn(
                      'mt-4 w-full max-w-64 rounded-lg shadow-xs',
                      'cursor-pointer transition-all duration-200 ease-out will-change-transform hover:scale-[1.01] hover:shadow-lg',
                    )}
                  />
                );
              }
              return `Unknown part type: ${JSON.stringify(part)}`;
            })
        ) : (
          <Markdown text={props.content} wordSpans={props.wordSpans} cursor={props.cursor} />
        )}
      </div>
      <Show when={props.cancelled}>
        <Tag variant="secondary" class="my-2">
          <IconBan class="size-3" />
          Full response cancelled by user
        </Tag>
      </Show>
      {/* An answer that is still arriving has nothing complete to copy, play or measure. */}
      <Show when={props.role === 'assistant' && props.status !== 'loading'}>
        <div class="mt-2 flex items-center gap-[1px]">
          <Show when={props.audioStatus}>
            {(status) => (
              <Show
                when={status() === 'unavailable'}
                fallback={<AudioButton status={status()} onClick={props.onAudioClick} />}
              >
                <Tooltip>
                  <TooltipTrigger as="span" tabIndex={0} class="inline-flex cursor-default">
                    <AudioButton status="unavailable" onClick={props.onAudioClick} />
                  </TooltipTrigger>
                  <TooltipContent>Add an OpenRouter key to listen</TooltipContent>
                </Tooltip>
              </Show>
            )}
          </Show>
          <CopyButton text={messageText(props.content)} />
          <StatsPopover stats={props.usage} />
        </div>
      </Show>
    </MessageContainer>
  );
};

const MessageContainer: ParentComponent<
  Pick<MessageProps, 'id' | 'role'> & { showAvatars?: boolean }
> = (props) => {
  return (
    <div
      data-message-id={props.id}
      // Leaves room for the sticky lane header when a message is scrolled into view.
      class="max-w-full scroll-mt-14 rounded-xl py-bubble-y"
      classList={{
        'gap-2 flex items-start': props.showAvatars,
        'self-start bg-agent px-agent-x text-agent-fg': props.role === 'assistant',
        'self-end bg-user px-bubble-x text-user-fg': props.role === 'user',
      }}
    >
      {props.children}
    </div>
  );
};
