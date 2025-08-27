import { useNavigate } from '@solidjs/router';
import { createSignal, For, ParentComponent, Show } from 'solid-js';

import { createMessage } from '~/hooks/message-utils';
import { setStore, store } from '~/store';
import {
  addMessageToSessionChats,
  autonameChat,
  setAssistant,
  setSessionInput,
} from '~/store/actions';
import { selectChatById, selectSessionById } from '~/store/selectors';

import { ChatInput } from '../chat/chat-input';
import { ChatPanel } from '../chat/chat-panel';
import { useSession } from '../connected/session-provider';
import { SpeedDial } from '../connected/speed-dial';

type MultiChatLayoutProps = {
  sessionId: string;
};

export const MultiChatLayout: ParentComponent<MultiChatLayoutProps> = (props) => {
  const navigate = useNavigate();
  const selectedSession = selectSessionById(() => props.sessionId);
  const session = () => selectedSession();
  const [attachments, setAttachments] = createSignal<File[] | undefined>();
  const sessionContext = useSession();

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
    const inputValue = session()?.input ?? store.draftSession.input;

    if (inputValue === '' || inputValue === undefined) return;
    setSessionInput('', props.sessionId);

    const _sessionChats = (session() ? session()?.chats : store.draftSession.chats) || [];
    const message = await createMessage(inputValue, _attachments, {
      chatIds: _sessionChats,
      draft: _isDraft,
    });

    if (!message) return;
    const id = addMessageToSessionChats(message, props.sessionId);

    if (!props.sessionId) {
      navigate(`/session/${id}`);
      if (store.settings.generateTitles) {
        autonameChat(id, inputValue);
      }
    }

    setAttachments(undefined);
  }

  return (
    <div class="relative flex h-full w-full flex-col">
      {/* this column reverse container is needed to keep the scrollbar at the bottom */}
      <div class="flex h-full w-full flex-col-reverse overflow-auto">
        <Show when={session()} fallback={<BlankSession attachments={attachments()} />}>
          {(s) => (
            <ChatPanelLayout numChats={s().chats.length}>
              <For each={s().chats}>
                {(chatId, index) => {
                  const chat = selectChatById(chatId)();
                  if (!chat) return null;

                  return (
                    <ChatPanel
                      chat={chat}
                      sessionId={s().id}
                      onChangeAssistant={(id) => setAssistant(id, chat.id)}
                      attachments={attachments()}
                      isExample={s().created === -1}
                      isFirst={index() === 0}
                      isLast={index() === s().chats.length - 1}
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
        isLoading={sessionContext.isLoading()}
        onInput={handleInput}
        onSubmit={handleSubmit}
        onFileSelect={handleFileSelect}
        onRemoveFile={handleRemoveFile}
        onCancel={sessionContext.cancelChats}
        attachments={attachments()}
      />
    </div>
  );
};

export const ChatPanelLayout: ParentComponent<{ numChats: number }> = (props) => {
  return (
    <div
      class="group/panels relative grid flex-1 justify-center px-4"
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
        {(chat, index) => (
          <ChatPanel
            chat={chat}
            sessionId={store.draftSession.id}
            onChangeAssistant={(id) => handleAssistantChange(id, chat.id)}
            attachments={props.attachments}
            isFirst={index() === 0}
            isLast={index() === store.draftChats.length - 1}
          />
        )}
      </For>
      <div class="absolute inset-0 flex items-center justify-center gap-4 pointer-events-none">
        <div class="flex flex-col gap-20 self-center pointer-events-auto">
          <SpeedDial items={store.speedDial} />
        </div>
      </div>
    </ChatPanelLayout>
  );
}
