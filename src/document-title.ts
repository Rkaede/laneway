import type { SessionProps } from '~/types';

export function getDocumentTitle(
  route: { title?: string; session?: boolean } | undefined,
  session?: Pick<SessionProps, 'title' | 'type'>,
): string {
  let title = route?.title ?? 'Page not found';

  if (route?.session) {
    title = session
      ? session.title.trim() || (session.type === 'note' ? 'New Note' : 'New Chat')
      : 'Session not found';
  }

  return `${title} | Laneway`;
}
