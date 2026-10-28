import type { SessionType } from '~/types';

export function parseSessionType(type: string | string[] | undefined): SessionType {
  return type === 'note' ? 'note' : 'chat';
}
