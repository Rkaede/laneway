import { type Component, lazy, type ParentComponent, Show } from 'solid-js';
import { createSignal } from 'solid-js';

import { ModelIcon } from '~/components/connected';
import { IconBan, IconUser } from '~/components/icons/ui';
import { Avatar, Tag } from '~/components/ui';
import { Lightbox } from '~/components/ui/lightbox/lightbox';
import { LocalImage } from '~/components/ui/local-image';
import { AudioButton } from '~/components/ui/message/audio-button';
import { CopyButton } from '~/components/ui/message/copy-button';
import { StatsPopover } from '~/components/ui/stats-popover';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';
import { createAudio } from '~/hooks/use-audio';
import { store } from '~/store/index';
import { apiKeys } from '~/store/keys';
import type { ImagePart, MessageProps, TextPart } from '~/types';
import { cn } from '~/util';

const Markdown = lazy(() => import('~/components/ui/markdown'));

const ModelTitle: ParentComponent = (props) => {
  return (
    <div class="mb-1 flex items-center gap-1 px-1 text-assistant-foreground/80">
      <span class="text-xs font-semibold">{props.children}</span>
    </div>
  );
};

export const Message: Component<MessageProps & { tts?: boolean; copy?: boolean }> = (props) => {
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

  const content = () =>
    typeof props.content === 'string'
      ? props.content
      : props.content
          .filter((p) => p.type === 'text')
          .map((p) => (p as TextPart).text)
          .join('\n');

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
      <Show when={lightboxOpen()}>
        <Lightbox
          images={lightboxImages()}
          initialIndex={lightboxIndex()}
          open={lightboxOpen()}
          onClose={() => setLightboxOpen(false)}
        />
      </Show>
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
                    sourceType={part.image.sourceType}
                    onClick={() => handleImageClick(part, imageIndex)}
                    class={cn(
                      'mt-4 w-full max-w-64 rounded-lg shadow-sm',
                      'cursor-pointer transition-all duration-200 ease-out will-change-transform hover:scale-[1.01] hover:shadow-lg',
                    )}
                  />
                );
              }
              return `Unknown part type: ${JSON.stringify(part)}`;
            })
        ) : (
          <Markdown text={props.content} />
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
