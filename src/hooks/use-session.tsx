import { useNavigate } from '@solidjs/router';
import { nanoid } from 'nanoid';
import { Accessor, mergeProps } from 'solid-js';
import { createStore } from 'solid-js/store';

import { imageCache } from '~/services/image-cache';
import { store } from '~/store';
import { setSessionInput } from '~/store/actions';
import { addMessageToSessionChats, autonameChat } from '~/store/actions';
import {
  selectChatById,
  selectDraftChatById,
  selectModelById,
  selectSessionById,
} from '~/store/selectors';
import { ImagePart, MessageProps } from '~/types';

type SessionStore = {
  attachments: File[];
  draft: boolean;
  chatIds: string[];
};

export function createSession(sessionId?: Accessor<string>) {
  const navigate = useNavigate();
  const selectedSession = selectSessionById(() => sessionId?.());
  const session = () => selectedSession() ?? store.draftSession;

  const [sessionStore, setSessionStore] = createStore<SessionStore>({
    attachments: [],
    draft: sessionId === undefined,
    chatIds: session().chats,
  });

  function handleInput(value: string) {
    setSessionInput(value, sessionId?.());
  }

  function handleFileSelect(file: File) {
    setSessionStore('attachments', (prev) => [...prev, file]);
  }

  function handleRemoveFile(file: File) {
    setSessionStore('attachments', (prev) => prev?.filter((f) => f !== file));
  }

  async function handleSubmit() {
    if (sessionStore.attachments && sessionStore.attachments.length > 0) {
      for (const chatId of sessionStore.chatIds) {
        const chat = sessionStore.draft
          ? selectDraftChatById(chatId)()
          : selectChatById(chatId)();
        const model = selectModelById(() => chat?.modelId)();

        if (model?.vision === false) {
          return; // Early return if any model does not support vision
        }
      }
    }

    const _input = session().input;
    if (_input === '' || _input === undefined) return;

    if (session().type !== 'note') {
      setSessionInput('', sessionId?.());
    }

    // if attachments are present, add them to the session
    const imageCacheFiles: { filename: string; storageId: string }[] = [];
    if (sessionStore.attachments) {
      for (const file of sessionStore.attachments) {
        // generate a unique name for the file
        const name = file.name + '_' + Date.now();
        imageCacheFiles.push({ filename: file.name, storageId: name });
        await imageCache.add(name, file);
      }
    }

    const message = {
      id: nanoid(),
      role: 'user',
      content:
        imageCacheFiles.length > 0
          ? [
              ...imageCacheFiles.map((file) => ({ type: 'image', image: file }) as ImagePart),
              { type: 'text', text: _input },
            ]
          : _input,
    } satisfies MessageProps;

    const id = addMessageToSessionChats(message, sessionId?.(), session().type);

    if (!sessionId?.()) {
      navigate(`/session/${id}`);
      if (store.settings.generateTitles) {
        autonameChat(id, _input);
      }
    }

    setSessionStore('attachments', []);
  }

  const hook = mergeProps(session, sessionStore, {
    handleInput,
    handleFileSelect,
    handleRemoveFile,
    handleSubmit,
  });
  return hook;
}
