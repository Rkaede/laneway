import { nanoid } from 'nanoid';

import { imageCache } from '~/services/image-cache';
import { store } from '~/store';
import { models } from '~/store/models';
import { getChatModel } from '~/store/util';
import type { ImagePart, MessageProps } from '~/types';

export interface MessageContext {
  chatIds: string[];
  draft: boolean;
}

/**
 * Create a user message, caching any image attachments and validating vision
 * support across the target chats.
 *
 * Returns `undefined` if attachments are provided but no target chat's model has
 * confirmed vision support.
 */
export async function createMessage(
  input: string,
  attachments: File[] | undefined,
  context: MessageContext,
): Promise<MessageProps | undefined> {
  if (attachments && attachments.length > 0) {
    const supportsVision = context.chatIds.some((chatId) => {
      const chat = context.draft
        ? store.draftChats.find((c) => c.id === chatId)
        : store.chats.find((c) => c.id === chatId);
      const model = getChatModel(chat, store.assistants, models);
      return model?.vision === true;
    });
    if (!supportsVision) return undefined;
  }

  const imageCacheFiles: { filename: string; storageId: string }[] = [];
  if (attachments) {
    for (const file of attachments) {
      const name = `${file.name}_${Date.now()}`;
      imageCacheFiles.push({ filename: file.name, storageId: name });
      await imageCache.add(name, file);
    }
  }

  const message: MessageProps = {
    id: nanoid(),
    role: 'user',
    content:
      imageCacheFiles.length > 0
        ? [
            ...imageCacheFiles.map((f) => ({ type: 'image', image: f }) as ImagePart),
            { type: 'text', text: input },
          ]
        : input,
  };

  return message;
}
