import type { SessionType } from '~/types';

export function parseSessionType(type: string | string[] | undefined): SessionType {
  return type === 'note' ? 'note' : 'chat';
}

/** The message a search result points at, from the `?message=` query parameter. */
export function messageIdFromQuery(value: string | string[] | undefined) {
  const id = Array.isArray(value) ? value[0] : value;
  return id || undefined;
}

/** Matches the id exactly instead of building a selector from it. */
export function findMessageElement(root: ParentNode, messageId: string) {
  return (
    Array.from(root.querySelectorAll<HTMLElement>('[data-message-id]')).find(
      (element) => element.dataset.messageId === messageId,
    ) ?? null
  );
}
