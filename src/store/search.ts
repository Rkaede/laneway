import {
  allowedEdits,
  bestChunks,
  type ChunkHit,
  corrections,
  documentTitles,
  editDistance,
  nearestChunks,
  termQuery,
  textMatches,
} from '~/db/search';
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
 * Search over chats, notes and library documents. Message and document text is searched in the
 * database, with typo correction from the dictionary of indexed words. Titles, models, dates and
 * note drafts are matched here, from the store. With semantic search on, chunks close in meaning
 * to the query join the results, merged by reciprocal rank fusion.
 */

/** What a result matched: `meaning` when only semantic search found it. */
export type SearchField = 'title' | 'model' | 'message' | 'date' | 'meaning';

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

export type DocumentHit = {
  documentId: string;
  title: string;
  created: number;
  matchedOn: 'title' | 'message' | 'meaning';
  /** The passage to scroll to, when the match is in the text. */
  chunkId?: string;
  snippet?: SearchSnippet;
};

export type SearchResults = { sessions: SearchHit[]; documents: DocumentHit[] };

export type SearchState = {
  sessions: SessionProps[];
  chats: ChatProps[];
  assistants: AssistantProps[];
};

export type SearchOptions = {
  now?: number;
  limit?: number;
  /** The query's embedding, when semantic search is on. */
  embedding?: { vector: number[]; model: string };
};

export const DEFAULT_RECENT_LIMIT = 5;
export const DEFAULT_RESULT_LIMIT = 20;
export const DEFAULT_DOCUMENT_LIMIT = 5;

/**
 * Chunks further than this in cosine distance are not related enough to show. Unrelated text
 * scores around 0.8 to 0.9 with text-embedding-3-small; related text below about 0.7.
 */
export const MAX_SEMANTIC_DISTANCE = 0.7;

/** How many nearest chunks semantic search considers. */
const SEMANTIC_CANDIDATES = 50;

/** The usual constant of reciprocal rank fusion, which keeps one list's top result from dominating. */
const RRF_K = 60;

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

export function documentHref(documentId: string, chunkId?: string) {
  const path = `/library/${documentId}`;
  return chunkId ? `${path}?chunk=${encodeURIComponent(chunkId)}` : path;
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

const WORD = /[\p{L}\p{N}]+/gu;

/** The letters-and-digits runs of a text, lowercased: "GPT-5.1" gives gpt, 5 and 1. */
function termsOf(text: string) {
  return text.toLowerCase().match(WORD) ?? [];
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

/** How well a term matches a word: 1 for the start of the word, 0.5 for a typo, else 0. */
function termScore(term: string, word: string) {
  if (word.startsWith(term)) return 1;
  const edits = allowedEdits(term);
  return edits && editDistance(term, word) <= edits ? 0.5 : 0;
}

function bestScore(term: string, words: string[]) {
  let best = 0;
  for (const word of words) {
    best = Math.max(best, termScore(term, word));
    if (best === 1) break;
  }
  return best;
}

const FIELD_WEIGHTS = { title: 4, model: 2, message: 1, date: 1 } as const;
const FIELD_ORDER: SearchField[] = ['title', 'model', 'message', 'date'];

type QueryWord = { word: string; terms: string[]; dates: string[] };

/** Words of a query that can match. Punctuation on its own matches nothing. */
function queryWords(query: string, now: number): QueryWord[] {
  return tokenize(query)
    .map((word) => ({ word, terms: termsOf(word), dates: [word, ...relativeDates(word, now)] }))
    .filter((word) => word.terms.length > 0);
}

type Candidate = { score: number; fields: Set<SearchField> };

/**
 * Scores something against the query, or returns undefined when a word does not match. Each word
 * may match a different field, and a date only as a whole keyword.
 */
function scoreFields(
  words: QueryWord[],
  fields: { title: string[]; model: string[]; message: string[]; dates: string[] },
  textMatched: (term: string) => boolean,
): Candidate | undefined {
  const matched = new Set<SearchField>();
  let score = 0;
  for (const { terms, dates } of words) {
    if (dates.some((date) => fields.dates.includes(date))) {
      matched.add('date');
      score += FIELD_WEIGHTS.date;
      continue;
    }
    let wordScore = 0;
    for (const term of terms) {
      const scores = {
        title: bestScore(term, fields.title) * FIELD_WEIGHTS.title,
        model: bestScore(term, fields.model) * FIELD_WEIGHTS.model,
        message:
          Math.max(bestScore(term, fields.message), textMatched(term) ? 1 : 0) *
          FIELD_WEIGHTS.message,
      };
      const best = Math.max(scores.title, scores.model, scores.message);
      if (!best) return undefined;
      for (const field of ['title', 'model', 'message'] as const) {
        if (scores[field]) matched.add(field);
      }
      wordScore += best / terms.length;
    }
    score += wordScore;
  }
  return { score, fields: matched };
}

const matchedField = (fields: Set<SearchField>) =>
  FIELD_ORDER.find((field) => fields.has(field)) ?? 'meaning';

/** Where the first word matching one of the terms starts and ends in the text. */
function findMatch(text: string, terms: string[]) {
  let best: { index: number; length: number; score: number } | undefined;
  for (const match of text.matchAll(WORD)) {
    const word = match[0].toLowerCase();
    const score = Math.max(0, ...terms.map((term) => termScore(term, word)));
    // A whole-word or prefix match beats an earlier typo match.
    if (score > (best?.score ?? 0)) best = { index: match.index, length: word.length, score };
    if (score === 1) break;
  }
  return best;
}

function snippetAround(text: string, start: number, length: number): SearchSnippet {
  const from = Math.max(0, start - SNIPPET_BEFORE);
  const to = Math.min(text.length, start + length + SNIPPET_AFTER);
  const clean = (value: string) => value.replaceAll(/\s+/g, ' ');
  return {
    before: (from > 0 ? '…' : '') + clean(text.slice(from, start)),
    match: clean(text.slice(start, start + length)),
    after: clean(text.slice(start + length, to)) + (to < text.length ? '…' : ''),
  };
}

/** A snippet around the first word that matches one of the terms. */
export function snippetFor(text: string, terms: string[]): SearchSnippet | undefined {
  const found = findMatch(text, terms);
  return found && snippetAround(text, found.index, found.length);
}

/** The start of a passage, for a result found by meaning, which has no word to highlight. */
function openingSnippet(text: string): SearchSnippet {
  const end = SNIPPET_BEFORE + SNIPPET_AFTER;
  const clean = text.replaceAll(/\s+/g, ' ').trim();
  return {
    before: '',
    match: '',
    after: clean.slice(0, end) + (clean.length > end ? '…' : ''),
  };
}

function modelWords(chats: ChatProps[], assistants: AssistantProps[], models: ModelProps[]) {
  const words = new Set<string>();
  for (const chat of chats) {
    const model = getChatModel(chat, assistants, models);
    const assistant = assistants.find((a) => a.id === chat.assistantId);
    for (const text of [model?.title, model?.id, model?.creator?.name, assistant?.title]) {
      for (const word of termsOf(text ?? '')) words.add(word);
    }
  }
  return [...words];
}

/** Merges ranked lists by reciprocal rank fusion. Earlier lists win ties. */
function fuse<T>(lists: T[][], key: (item: T) => string) {
  const scores = new Map<string, { item: T; score: number; order: number }>();
  let order = 0;
  for (const list of lists) {
    list.forEach((item, rank) => {
      const id = key(item);
      const entry = scores.get(id) ?? { item, score: 0, order: order++ };
      entry.score += 1 / (RRF_K + rank + 1);
      scores.set(id, entry);
    });
  }
  return [...scores.values()]
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .map((entry) => entry.item);
}

/** The nearest chunks, best first, one per session and one per document. */
function semanticSources(chunks: ChunkHit[]) {
  const sessions = new Map<string, ChunkHit>();
  const documents = new Map<string, ChunkHit>();
  for (const chunk of chunks) {
    if (chunk.sessionId && !sessions.has(chunk.sessionId)) sessions.set(chunk.sessionId, chunk);
    if (chunk.documentId && !documents.has(chunk.documentId)) {
      documents.set(chunk.documentId, chunk);
    }
  }
  return { sessions, documents };
}

/**
 * Chats, notes and documents where every word of the query matches. Words match as prefixes,
 * and longer words tolerate a typo. Title matches rank first, then models and text, and newer
 * sessions win ties.
 */
export async function search(
  db: Parameters<typeof textMatches>[0],
  query: string,
  state: SearchState,
  models: ModelProps[],
  { now = Date.now(), limit = DEFAULT_RESULT_LIMIT, embedding }: SearchOptions = {},
): Promise<SearchResults> {
  const words = queryWords(query, now);
  if (!words.length) return { sessions: [], documents: [] };

  const terms = [...new Set(words.flatMap((word) => word.terms))];
  const queries = new Map(
    await Promise.all(
      terms.map(async (term) => [term, termQuery(term, await corrections(db, term))] as const),
    ),
  );
  const [matches, documents, nearest] = await Promise.all([
    Promise.all(
      terms.map(async (term) => [term, await textMatches(db, queries.get(term)!)] as const),
    ),
    documentTitles(db),
    embedding
      ? nearestChunks(db, embedding.vector, {
          model: embedding.model,
          limit: SEMANTIC_CANDIDATES,
          maxDistance: MAX_SEMANTIC_DISTANCE,
        })
      : Promise.resolve([]),
  ]);
  const textMatch = new Map(matches);

  // Sessions, scored on the store's fields and the database's text matches.
  const chatsById = new Map(state.chats.map((chat) => [chat.id, chat]));
  const sessionsById = new Map<string, SessionProps>();
  const scored: { session: SessionProps; candidate: Candidate; note?: string }[] = [];
  for (const session of state.sessions) {
    if (!isUserSession(session) || sessionsById.has(session.id)) continue;
    sessionsById.set(session.id, session);
    const chats = session.chats.flatMap((id) => chatsById.get(id) ?? []);
    // A note's draft is its text, and lives only in the store.
    const note = session.type === 'note' ? session.input || undefined : undefined;
    const candidate = scoreFields(
      words,
      {
        title: termsOf(session.title),
        model: modelWords(chats, state.assistants, models),
        message: termsOf(note ?? ''),
        dates: dateKeywords(session.created).split(' '),
      },
      (term) => !!textMatch.get(term)?.sessions.has(session.id),
    );
    if (candidate) scored.push({ session, candidate, note });
  }
  scored.sort(
    (a, b) => b.candidate.score - a.candidate.score || b.session.created - a.session.created,
  );

  const documentsById = new Map(documents.map((document) => [document.id, document]));
  const scoredDocuments = documents
    .flatMap((document) => {
      const candidate = scoreFields(
        words,
        { title: termsOf(document.title), model: [], message: [], dates: [] },
        (term) => !!textMatch.get(term)?.documents.has(document.id),
      );
      return candidate ? [{ document, candidate }] : [];
    })
    .sort(
      (a, b) =>
        b.candidate.score - a.candidate.score || b.document.created - a.document.created,
    );

  const semantic = semanticSources(nearest);
  const sessionOrder = fuse(
    [
      scored.map((entry) => entry.session.id),
      [...semantic.sessions.keys()].filter((id) => sessionsById.has(id)),
    ],
    (id) => id,
  ).slice(0, limit);
  const documentOrder = fuse(
    [
      scoredDocuments.map((entry) => entry.document.id),
      [...semantic.documents.keys()].filter((id) => documentsById.has(id)),
    ],
    (id) => id,
  ).slice(0, DEFAULT_DOCUMENT_LIMIT);

  // The passage to show for each keyword match whose text matched.
  const keywordSessions = new Map(scored.map((entry) => [entry.session.id, entry]));
  const keywordDocuments = new Map(scoredDocuments.map((entry) => [entry.document.id, entry]));
  const chunks = await bestChunks(
    db,
    terms.map((term) => queries.get(term)!),
    sessionOrder.filter((id) => keywordSessions.get(id)?.candidate.fields.has('message')),
    documentOrder.filter((id) => keywordDocuments.get(id)?.candidate.fields.has('message')),
  );
  const chunkFor = new Map(
    chunks.map((chunk) => [chunk.sessionId ?? chunk.documentId!, chunk]),
  );

  const sessionHits = sessionOrder.map((id): SearchHit => {
    const session = sessionsById.get(id)!;
    const keyword = keywordSessions.get(id);
    const hit: SearchHit = {
      sessionId: id,
      title: session.title,
      type: session.type,
      created: session.created,
      matchedOn: keyword ? matchedField(keyword.candidate.fields) : 'meaning',
    };
    const chunk = chunkFor.get(id);
    const noteSnippet = keyword?.note ? snippetFor(keyword.note, terms) : undefined;
    if (noteSnippet) {
      hit.snippet = noteSnippet;
    } else if (chunk) {
      hit.messageId = chunk.messageId ?? undefined;
      hit.snippet = snippetFor(chunk.text, terms) ?? openingSnippet(chunk.text);
    } else if (!keyword) {
      const near = semantic.sessions.get(id)!;
      hit.messageId = near.messageId ?? undefined;
      hit.snippet = openingSnippet(near.text);
    }
    return hit;
  });

  const documentHits = documentOrder.map((id): DocumentHit => {
    const document = documentsById.get(id)!;
    const keyword = keywordDocuments.get(id);
    const chunk = chunkFor.get(id) ?? (keyword ? undefined : semantic.documents.get(id));
    const field = keyword ? matchedField(keyword.candidate.fields) : 'meaning';
    return {
      documentId: id,
      title: document.title,
      created: document.created,
      matchedOn: field === 'title' || field === 'meaning' ? field : 'message',
      chunkId: chunk?.id,
      snippet: chunk && (snippetFor(chunk.text, terms) ?? openingSnippet(chunk.text)),
    };
  });

  return { sessions: sessionHits, documents: documentHits };
}
