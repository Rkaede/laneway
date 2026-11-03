import type {
  AssistantProps,
  ChatProps,
  MessageProps,
  ModelProps,
  SessionProps,
  SessionType,
} from '~/types';

import { getChatModel } from './util';

/**
 * Lexical search over chats and notes. There is no stored index: every search reads the persisted
 * store, so deleting a session or restoring a backup is reflected the next time anyone searches.
 */

export type SearchField = 'title' | 'message' | 'model' | 'date';

export type SearchSnippet = { before: string; match: string; after: string };

export type SearchHit = {
  sessionId: string;
  title: string;
  type: SessionType;
  created: number;
  /** The first field that matched, in order of relevance. */
  matchedOn: SearchField;
  /** The turn to scroll to, when the match is in a message. */
  messageId?: string;
  snippet?: SearchSnippet;
};

export type SearchState = {
  sessions: SessionProps[];
  chats: ChatProps[];
  assistants: AssistantProps[];
};

export const DEFAULT_RECENT_LIMIT = 5;
export const DEFAULT_RESULT_LIMIT = 20;

const SNIPPET_BEFORE = 40;
const SNIPPET_AFTER = 80;

const MONTHS = [
  'january',
  'february',
  'march',
  'april',
  'may',
  'june',
  'july',
  'august',
  'september',
  'october',
  'november',
  'december',
];

/** Example sessions ship with the app and have no creation date. */
const isUserSession = (session: SessionProps) => session.created !== -1;

export function sessionHref(sessionId: string, messageId?: string) {
  const path = `/session/${sessionId}`;
  return messageId ? `${path}?message=${encodeURIComponent(messageId)}` : path;
}

/** The newest chats and notes first. */
export function recentSessions(sessions: SessionProps[], limit = DEFAULT_RECENT_LIMIT) {
  return sessions
    .filter(isUserSession)
    .sort((a, b) => b.created - a.created)
    .slice(0, limit);
}

export function messageText(message: Pick<MessageProps, 'content'>) {
  if (typeof message.content === 'string') return message.content;
  return message.content
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('\n');
}

export function tokenize(query: string) {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

const pad = (value: number) => String(value).padStart(2, '0');

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * The words a person might use to find a day: "2026-11-03", "november", "nov", "2026", "today".
 */
export function dateKeywords(timestamp: number, now = Date.now()) {
  const date = new Date(timestamp);
  const month = MONTHS[date.getMonth()];
  const words = [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    month,
    month.slice(0, 3),
    String(date.getFullYear()),
    String(date.getDate()),
  ];

  const daysAgo = Math.round(
    (startOfDay(new Date(now)).getTime() - startOfDay(date).getTime()) / 86_400_000,
  );
  if (daysAgo === 0) words.push('today');
  if (daysAgo === 1) words.push('yesterday');

  return words.join(' ');
}

function snippetAround(
  text: string,
  lowerText: string,
  token: string,
): SearchSnippet | undefined {
  const index = lowerText.indexOf(token);
  if (index === -1) return undefined;

  const start = Math.max(0, index - SNIPPET_BEFORE);
  const end = Math.min(text.length, index + token.length + SNIPPET_AFTER);
  const clean = (value: string) => value.replaceAll(/\s+/g, ' ');

  return {
    before: (start > 0 ? '…' : '') + clean(text.slice(start, index)),
    match: clean(text.slice(index, index + token.length)),
    after: clean(text.slice(index + token.length, end)) + (end < text.length ? '…' : ''),
  };
}

type Turn = { message: MessageProps; text: string; lowerText: string };

function turnsOf(chats: ChatProps[]): Turn[] {
  return chats.flatMap((chat) =>
    chat.messages
      .filter((message) => message.role === 'user' || message.role === 'assistant')
      .map((message) => {
        const text = messageText(message);
        return { message, text, lowerText: text.toLowerCase() };
      }),
  );
}

/** The turn that contains the most search words. The first one wins ties. */
function bestTurn(turns: Turn[], tokens: string[]) {
  let best: { turn: Turn; count: number } | undefined;
  for (const turn of turns) {
    const count = tokens.filter((token) => turn.lowerText.includes(token)).length;
    if (count > (best?.count ?? 0)) best = { turn, count };
    if (count === tokens.length) break;
  }
  return best;
}

function modelWords(chats: ChatProps[], state: SearchState, models: ModelProps[]) {
  const words = new Set<string>();
  for (const chat of chats) {
    const model = getChatModel(chat, state.assistants, models);
    const assistant = state.assistants.find((a) => a.id === chat.assistantId);
    for (const word of [model?.title, model?.id, model?.creator?.name, assistant?.title]) {
      if (word) words.add(word);
    }
  }
  return [...words].join('\n').toLowerCase();
}

/**
 * Chats and notes where every word of the query appears somewhere in the title, the models used,
 * the date or the messages. Title matches rank first, then models, dates and message text, and
 * newer sessions win ties.
 */
export function searchSessions(
  query: string,
  state: SearchState,
  models: ModelProps[],
  { now = Date.now(), limit = DEFAULT_RESULT_LIMIT } = {},
): SearchHit[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  const scored: Array<{ hit: SearchHit; score: number }> = [];

  for (const session of state.sessions) {
    if (!isUserSession(session)) continue;

    const chats = session.chats
      .map((id) => state.chats.find((chat) => chat.id === id))
      .filter((chat): chat is ChatProps => chat !== undefined);

    const title = session.title.toLowerCase();
    const modelText = modelWords(chats, state, models);
    const dateText = dateKeywords(session.created, now);
    const noteText = session.type === 'note' ? (session.input ?? '') : '';
    const lowerNoteText = noteText.toLowerCase();
    const turns = turnsOf(chats);

    const inTitle = (token: string) => title.includes(token);
    const inModel = (token: string) => modelText.includes(token);
    const inDate = (token: string) => dateText.includes(token);
    const inText = (token: string) =>
      lowerNoteText.includes(token) || turns.some((turn) => turn.lowerText.includes(token));

    // Each word may match a different field, so "gpt yesterday" finds yesterday's GPT chats.
    if (
      !tokens.every(
        (token) => inTitle(token) || inModel(token) || inDate(token) || inText(token),
      )
    ) {
      continue;
    }

    const best = bestTurn(turns, tokens);
    const matchedOn: SearchField = tokens.some(inTitle)
      ? 'title'
      : tokens.some(inModel)
        ? 'model'
        : tokens.some(inText)
          ? 'message'
          : 'date';

    const hit: SearchHit = {
      sessionId: session.id,
      title: session.title,
      type: session.type,
      created: session.created,
      matchedOn,
    };

    if (best) {
      const token = tokens.find((t) => best.turn.lowerText.includes(t));
      hit.messageId = best.turn.message.id;
      hit.snippet = token
        ? snippetAround(best.turn.text, best.turn.lowerText, token)
        : undefined;
    } else {
      const token = tokens.find((t) => lowerNoteText.includes(t));
      if (token) hit.snippet = snippetAround(noteText, lowerNoteText, token);
    }

    const score =
      (tokens.every(inTitle) ? 8 : tokens.some(inTitle) ? 4 : 0) +
      (tokens.some(inModel) ? 2 : 0) +
      (tokens.some(inDate) ? 1 : 0) +
      (best ? best.count / tokens.length : 0);

    scored.push({ hit, score });
  }

  return scored
    .sort((a, b) => b.score - a.score || b.hit.created - a.hit.created)
    .slice(0, limit)
    .map(({ hit }) => hit);
}
