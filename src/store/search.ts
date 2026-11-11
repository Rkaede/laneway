import MiniSearch, { type Query, type SearchResult } from 'minisearch';

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
 * Full-text search over chats and notes, with prefix and typo-tolerant matching.
 *
 * The index lives in memory only. Call `sync` with the store before searching: it adds, replaces
 * and drops sessions to match, so deleting a session or restoring a backup is reflected on the
 * next sync. Sessions that have not changed are skipped, so syncing an up-to-date index is cheap.
 */

export type SearchField = 'title' | 'message' | 'model' | 'date';

export type SearchSnippet = { before: string; match: string; after: string };

export type SearchHit = {
  sessionId: string;
  title: string;
  type: SessionType;
  created: number;
  /** The best field that matched, in order of relevance. */
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

/** Splits a query into the words that must all match. */
export function tokenize(query: string) {
  return query.toLowerCase().split(/\s+/).filter(Boolean);
}

const pad = (value: number) => String(value).padStart(2, '0');

function isoDate(date: Date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** The words a person might use to find a day: "2026-11-03", "november", "nov", "2026", "3". */
export function dateKeywords(timestamp: number) {
  const date = new Date(timestamp);
  const month = MONTHS[date.getMonth()];
  return [
    isoDate(date),
    month,
    month.slice(0, 3),
    String(date.getFullYear()),
    String(date.getDate()),
  ].join(' ');
}

/** "today" and "yesterday" move every day, so they are turned into dates when searching. */
function relativeDates(word: string, now: number) {
  const date = new Date(now);
  if (word === 'today') return [isoDate(date)];
  if (word === 'yesterday') {
    return [isoDate(new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1))];
  }
  return [];
}

type Passage = { messageId?: string; text: string; lower?: string };

type Entry = {
  session: SessionProps;
  title: string;
  model: string;
  date: string;
  /** The note body, then each user and assistant turn. */
  passages: Passage[];
};

type Doc = { id: string; title: string; model: string; text: string; date: string };

const TEXT_FIELDS = ['title', 'model', 'text'];

const defaultTokenize: (text: string) => string[] = MiniSearch.getDefault('tokenize');

/** Words of a query that the index can match. Punctuation on its own matches nothing. */
const hasTerms = (word: string) => defaultTokenize(word).some(Boolean);

function modelWords(chats: ChatProps[], assistants: AssistantProps[], models: ModelProps[]) {
  const words = new Set<string>();
  for (const chat of chats) {
    const model = getChatModel(chat, assistants, models);
    const assistant = assistants.find((a) => a.id === chat.assistantId);
    for (const word of [model?.title, model?.id, model?.creator?.name, assistant?.title]) {
      if (word) words.add(word);
    }
  }
  return [...words].join('\n');
}

function entryFor(
  session: SessionProps,
  chatsById: Map<string, ChatProps>,
  assistants: AssistantProps[],
  models: ModelProps[],
): Entry {
  const chats = session.chats
    .map((id) => chatsById.get(id))
    .filter((chat): chat is ChatProps => chat !== undefined);

  const passages: Passage[] = [];
  if (session.type === 'note' && session.input) passages.push({ text: session.input });
  for (const chat of chats) {
    for (const message of chat.messages) {
      if (message.role !== 'user' && message.role !== 'assistant') continue;
      passages.push({ messageId: message.id, text: messageText(message) });
    }
  }

  return {
    session,
    title: session.title,
    model: modelWords(chats, assistants, models),
    date: dateKeywords(session.created),
    passages,
  };
}

function sameContent(a: Entry, b: Entry) {
  return (
    a.title === b.title &&
    a.model === b.model &&
    a.date === b.date &&
    a.passages.length === b.passages.length &&
    a.passages.every(
      (passage, i) =>
        passage.text === b.passages[i].text && passage.messageId === b.passages[i].messageId,
    )
  );
}

function toDoc(id: string, entry: Entry): Doc {
  return {
    id,
    title: entry.title,
    model: entry.model,
    date: entry.date,
    text: entry.passages.map((passage) => passage.text).join('\n'),
  };
}

/**
 * Each word may match a different field, so "gpt yesterday" finds yesterday's GPT chats. Dates
 * only match whole keywords, because a prefix such as "2" would otherwise match every session.
 */
function wordQuery(word: string, now: number): Query {
  return {
    combineWith: 'OR',
    queries: [
      { combineWith: 'AND', fields: TEXT_FIELDS, queries: [word] },
      {
        combineWith: 'OR',
        fields: ['date'],
        prefix: false,
        fuzzy: false,
        tokenize: (text) => [text],
        queries: [word, ...relativeDates(word, now)],
      },
    ],
  };
}

const WORD_CHAR = /[\p{L}\p{N}]/u;

/** Where a term first appears as a whole word, or anywhere if it never stands alone. */
function findTerm(lower: string, term: string) {
  const first = lower.indexOf(term);
  for (let index = first; index !== -1; index = lower.indexOf(term, index + 1)) {
    const before = lower[index - 1];
    const after = lower[index + term.length];
    const isWord =
      (before === undefined || !WORD_CHAR.test(before)) &&
      (after === undefined || !WORD_CHAR.test(after));
    if (isWord) return index;
  }
  return first;
}

function lowerOf(passage: Passage) {
  passage.lower ??= passage.text.toLowerCase();
  return passage.lower;
}

/** The passage that contains the most matched terms. The first one wins ties. */
function bestPassage(passages: Passage[], terms: string[]) {
  let best: { passage: Passage; count: number } | undefined;
  for (const passage of passages) {
    const lower = lowerOf(passage);
    const count = terms.filter((term) => lower.includes(term)).length;
    if (count > (best?.count ?? 0)) best = { passage, count };
    if (count === terms.length) break;
  }
  return best?.passage;
}

function snippetFor(passage: Passage, terms: string[]): SearchSnippet | undefined {
  const { text } = passage;
  const lower = lowerOf(passage);
  const found = terms
    .map((term) => ({ term, index: findTerm(lower, term) }))
    .filter(({ index }) => index !== -1)
    .sort((a, b) => a.index - b.index)[0];
  if (!found) return undefined;

  const { term, index } = found;
  const start = Math.max(0, index - SNIPPET_BEFORE);
  const end = Math.min(text.length, index + term.length + SNIPPET_AFTER);
  const clean = (value: string) => value.replaceAll(/\s+/g, ' ');

  return {
    before: (start > 0 ? '…' : '') + clean(text.slice(start, index)),
    match: clean(text.slice(index, index + term.length)),
    after: clean(text.slice(index + term.length, end)) + (end < text.length ? '…' : ''),
  };
}

/** The most relevant field a result matched on. */
function matchedField(fields: Set<string>): SearchField {
  if (fields.has('title')) return 'title';
  if (fields.has('model')) return 'model';
  if (fields.has('text')) return 'message';
  return 'date';
}

/** Short words have too many neighbours one typo away. Long words allow swapped letters. */
function fuzziness(term: string) {
  if (term.length >= 7) return 2;
  if (term.length >= 5) return 1;
  return false;
}

function toHit(entry: Entry, result: SearchResult): SearchHit {
  const matchedOn = matchedField(new Set(Object.values(result.match).flat()));

  const hit: SearchHit = {
    sessionId: entry.session.id,
    title: entry.session.title,
    type: entry.session.type,
    created: entry.session.created,
    matchedOn,
  };

  const textTerms = Object.entries(result.match)
    .filter(([, matchedFields]) => matchedFields.includes('text'))
    .map(([term]) => term);
  const passage = textTerms.length > 0 ? bestPassage(entry.passages, textTerms) : undefined;
  if (passage) {
    hit.messageId = passage.messageId;
    hit.snippet = snippetFor(passage, textTerms);
  }

  return hit;
}

export class SessionIndex {
  #entries = new Map<string, Entry>();
  #index = new MiniSearch<Doc>({
    fields: ['title', 'model', 'text', 'date'],
    tokenize: (text, field) => (field === 'date' ? text.split(' ') : defaultTokenize(text)),
    searchOptions: {
      boost: { title: 4, model: 2, text: 1, date: 1 },
      prefix: true,
      fuzzy: fuzziness,
    },
  });

  /** Brings the index in line with the store. */
  sync(state: SearchState, models: ModelProps[]) {
    const chatsById = new Map(state.chats.map((chat) => [chat.id, chat]));
    const seen = new Set<string>();

    for (const session of state.sessions) {
      if (!isUserSession(session) || seen.has(session.id)) continue;
      seen.add(session.id);

      const entry = entryFor(session, chatsById, state.assistants, models);
      const previous = this.#entries.get(session.id);
      this.#entries.set(session.id, entry);

      if (!previous) this.#index.add(toDoc(session.id, entry));
      else if (!sameContent(previous, entry)) this.#index.replace(toDoc(session.id, entry));
    }

    for (const id of this.#entries.keys()) {
      if (seen.has(id)) continue;
      this.#entries.delete(id);
      this.#index.discard(id);
    }
  }

  /**
   * Chats and notes where every word of the query matches the title, the models used, the date
   * or the messages. Words match as prefixes, and longer words tolerate a typo. Title matches
   * rank first, then models and message text, and newer sessions win ties.
   */
  search(query: string, { now = Date.now(), limit = DEFAULT_RESULT_LIMIT } = {}): SearchHit[] {
    const words = tokenize(query).filter(hasTerms);
    if (words.length === 0) return [];

    return this.#index
      .search({ combineWith: 'AND', queries: words.map((word) => wordQuery(word, now)) })
      .flatMap((result) => {
        const entry = this.#entries.get(result.id);
        return entry ? [{ result, entry }] : [];
      })
      .sort(
        (a, b) =>
          b.result.score - a.result.score || b.entry.session.created - a.entry.session.created,
      )
      .slice(0, limit)
      .map(({ result, entry }) => toHit(entry, result));
  }
}
