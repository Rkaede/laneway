import { useNavigate } from '@solidjs/router';
import { createSignal, For, ParentComponent, Show } from 'solid-js';

import { imageCache } from '~/services/image-cache';
import { setStore, store } from '~/store';
import {
  addMessageToSessionChats,
  autonameChat,
  setAssistant,
  setSessionInput,
} from '~/store/actions';
import { models } from '~/store/models';
import { ImagePart, MessageProps } from '~/types';

import { ChatInput } from '../chat/chat-input';
import { ChatPanel } from '../chat/chat-panel';
import { SpeedDial } from '../connected/speed-dial';

type MultiChatLayoutProps = {
  sessionId: string;
};

export const MultiChatLayout: ParentComponent<MultiChatLayoutProps> = (props) => {
  const navigate = useNavigate();
  const session = () => store.sessions.find((s) => s.id === props.sessionId);
  const [attachments, setAttachments] = createSignal<File[] | undefined>();

  function handleInput(value: string) {
    setSessionInput(value, props.sessionId);
  }

  function handleFileSelect(file: File) {
    setAttachments((prev) => [...(prev || []), file]);
  }

  function handleRemoveFile(file: File) {
    setAttachments((prev) => prev?.filter((f) => f !== file));
  }

  async function handleSubmit() {
    const _attachments = attachments();
    const _isDraft = session()?.id === undefined;

    if (_attachments && _attachments?.length > 0) {
      const _sessionChats = (session() ? session()?.chats : store.draftSession.chats) || [];

      for (const chatId of _sessionChats) {
        const chat = _isDraft
          ? store.draftChats.find((c) => c.id === chatId)
          : store.chats.find((c) => c.id === chatId);
        const model = models.find((m) => m.id === chat?.modelId);

        if (model?.vision === false) {
          return; // Early return if any model does not support vision
        }
      }
    }

    const inputValue = session()?.input ?? store.draftSession.input;

    if (inputValue === '' || inputValue === undefined) return;
    setSessionInput('', props.sessionId);

    // if attachments are present, add them to the session
    const imageCacheFiles: { filename: string; storageId: string }[] = [];
    if (_attachments) {
      if (!_attachments?.length) return;
      for (const file of _attachments) {
        // generate a unique name for the file
        const name = file.name + '_' + Date.now();
        imageCacheFiles.push({ filename: file.name, storageId: name });
        await imageCache.add(name, file);
      }
    }

    const message = {
      role: 'user',
      content:
        imageCacheFiles.length > 0
          ? [
              ...imageCacheFiles.map((f) => ({ type: 'image', image: f }) as ImagePart),
              { type: 'text', text: inputValue },
            ]
          : inputValue,
    } satisfies MessageProps;
    const id = addMessageToSessionChats(message, props.sessionId);

    if (!props.sessionId) {
      navigate(`/session/${id}`);
      if (store.settings.generateTitles) {
        autonameChat(id, inputValue);
      }
    }
  }

  return (
    <div class="relative flex h-full w-full flex-col">
      {/* this column reverse container is needed to keep the scrollbar at the bottom */}
      <div class="flex h-full w-full flex-col-reverse overflow-auto">
        <Show when={session()} fallback={<BlankSession attachments={attachments()} />}>
          {(s) => (
            <ChatPanelLayout numChats={s().chats.length}>
              <For each={s().chats}>
                {(chatId) => {
                  const chat = store.chats.find((c) => c.id === chatId);
                  if (!chat) return null;
                  return (
                    <ChatPanel
                      chat={chat}
                      sessionId={s().id}
                      onChangeAssistant={(id) => setAssistant(id, chat.id)}
                      attachments={attachments()}
                    />
                  );
                }}
              </For>
            </ChatPanelLayout>
          )}
        </Show>
      </div>
      <ChatInput
        hasVision
        input={session()?.input ?? store.draftSession.input ?? ''}
        isLoading={false}
        onInput={handleInput}
        onSubmit={handleSubmit}
        onFileSelect={handleFileSelect}
        onRemoveFile={handleRemoveFile}
        attachments={attachments()}
      />
    </div>
  );
};

export const ChatPanelLayout: ParentComponent<{ numChats: number }> = (props) => {
  return (
    <div
      class="relative grid flex-1 justify-center px-4"
      style={{
        'grid-template-columns': `repeat(${props.numChats}, minmax(0, 70ch))`,
      }}
    >
      {props.children}
    </div>
  );
};

export function BlankSession(props: { attachments?: File[] }) {
  function handleAssistantChange(id: string, chatId: string) {
    setStore('draftChats', (c) => c.id === chatId, 'assistantId', id);
  }

  return (
    <ChatPanelLayout numChats={store.draftChats.length}>
      <For each={store.draftChats}>
        {(chat) => (
          <ChatPanel
            chat={chat}
            sessionId={store.draftSession.id}
            onChangeAssistant={(id) => handleAssistantChange(id, chat.id)}
            attachments={props.attachments}
          />
        )}
      </For>
      <div class="absolute inset-0 flex items-center justify-center gap-4">
        <div class="flex flex-col gap-20 self-center">
          <SpeedDial items={store.speedDial} />
        </div>
      </div>
    </ChatPanelLayout>
  );
}
