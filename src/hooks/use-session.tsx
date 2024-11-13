import { useNavigate } from '@solidjs/router';
import { Accessor, mergeProps } from 'solid-js';
import { createStore } from 'solid-js/store';

import { imageCache } from '~/services/image-cache';
import { store } from '~/store';
import { setSessionInput } from '~/store/actions';
import { addMessageToSessionChats, autonameChat } from '~/store/actions';
import { models } from '~/store/models';
import { ImagePart, MessageProps } from '~/types';

type SessionStore = {
  attachments: File[];
  draft: boolean;
  chatIds: string[];
};

export function createSession(sessionId?: Accessor<string>) {
  const navigate = useNavigate();
  const session = () =>
    store.sessions.find((s) => s.id === sessionId?.()) ?? store.draftSession;

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
          ? store.draftChats.find((c) => c.id === chatId)
          : store.chats.find((c) => c.id === chatId);
        const model = models.find((m) => m.id === chat?.modelId);

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
      role: 'user',
      content:
        imageCacheFiles.length > 0
          ? [
              ...imageCacheFiles.map((f) => ({ type: 'image', image: f }) as ImagePart),
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
  }

  const hook = mergeProps(session, sessionStore, {
    handleInput,
    handleFileSelect,
    handleRemoveFile,
    handleSubmit,
  });
  return hook;
}
