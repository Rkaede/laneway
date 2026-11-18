import type { PGlite } from '@electric-sql/pglite';
import { afterAll, beforeAll, describe, expect, it } from 'bun:test';

import { createDatabase } from '~/db/create';
import { addDocument } from '~/db/documents';
import { indexMessages, saveEmbeddings } from '~/db/indexing';
import { EMBEDDING_DIMENSIONS } from '~/db/schema';
import { createDatabaseSync } from '~/db/sync';
import type {
  AssistantProps,
  ChatProps,
  MessageProps,
  ModelProps,
  SessionProps,
} from '~/types';

import {
  dateKeywords,
  documentHref,
  messageText,
  recentSessions,
  search as searchDatabase,
  type SearchOptions,
  type SearchState,
  sessionHref,
  tokenize,
} from './search';

const NOW = new Date(2026, 10, 3, 12).getTime();
const DAY = 86_400_000;

const gpt = { id: 'openai/gpt-5', title: 'GPT-5', creator: { name: 'OpenAI' } } as ModelProps;
const claude = {
  id: 'anthropic/claude-sonnet',
  title: 'Claude Sonnet',
  creator: { name: 'Anthropic' },
} as ModelProps;
const models = [gpt, claude];

const reviewer: AssistantProps = { id: 'a1', title: 'Code Reviewer', modelId: claude.id };

function message(id: string, role: MessageProps['role'], content: MessageProps['content']) {
  return { id, role, content } satisfies MessageProps;
}

function session(id: string, title: string, created: number, chats: string[], type = 'chat') {
  return { id, title, created, chats, type } as SessionProps;
}

function chat(id: string, messages: MessageProps[], extra: Partial<ChatProps> = {}): ChatProps {
  return { id, messages, status: 'idle', ...extra };
}

function fixture(): SearchState {
  return {
    assistants: [reviewer],
    sessions: [
      session('s-recipe', 'Sourdough starter', NOW - 10 * DAY, ['c-recipe']),
      session('s-code', 'Refactor parser', NOW - DAY, ['c-code']),
      session('s-note', 'Meeting prep', NOW, ['c-note'], 'note'),
      session('s-example', 'Example about sourdough', -1, ['c-example']),
    ],
    chats: [
      chat(
        'c-recipe',
        [
          message('m1', 'user', 'How long should I feed my starter before baking?'),
          message(
            'm2',
            'assistant',
            'Feed it twice a day for a week, then bake with the levain.',
          ),
        ],
        { modelId: gpt.id },
      ),
      chat(
        'c-code',
        [
          message('m3', 'user', [
            { type: 'text', text: 'Please split the parser into a lexer and a tokenizer.' },
          ]),
          message('m4', 'system', 'hidden system prompt mentioning sourdough'),
        ],
        { assistantId: reviewer.id },
      ),
      chat('c-note', [message('m5', 'assistant', 'Agenda: roadmap, hiring, budget')], {
        modelId: gpt.id,
      }),
      chat('c-example', [message('m6', 'user', 'sourdough')], { modelId: gpt.id }),
    ],
  };
}

let db: PGlite;

beforeAll(async () => {
  db = await createDatabase();
});

afterAll(() => db.close());

/** Saves the state's chats to the database and indexes them, as the app does after a sync. */
async function load(state: SearchState) {
  await db.exec('delete from sessions; delete from documents; delete from search_words');
  await createDatabaseSync({ getDatabase: async () => db, getState: () => state }).sync();
  await indexMessages(db);
}

async function searchAll(
  query: string,
  state = fixture(),
  options: SearchOptions & { models?: ModelProps[] } = {},
) {
  await load(state);
  return searchDatabase(db, query, state, options.models ?? models, { now: NOW, ...options });
}

const search = async (query: string, state = fixture(), options: SearchOptions = {}) =>
  (await searchAll(query, state, options)).sessions;

const ids = async (query: string, state = fixture()) =>
  (await search(query, state)).map((hit) => hit.sessionId);

describe('tokenize', () => {
  it('lowercases and splits on whitespace', () => {
    expect(tokenize('  Hello   WORLD ')).toEqual(['hello', 'world']);
    expect(tokenize('   ')).toEqual([]);
  });
});

describe('messageText', () => {
  it('joins the text parts and ignores images', () => {
    expect(
      messageText({
        content: [
          { type: 'image', image: { filename: 'a.png', storageId: 'x' } },
          { type: 'text', text: 'one' },
          { type: 'text', text: 'two' },
        ],
      }),
    ).toBe('one\ntwo');
  });
});

describe('sessionHref', () => {
  it('links to the session, and to a turn when there is one', () => {
    expect(sessionHref('abc')).toBe('/session/abc');
    expect(sessionHref('abc', 'm 1')).toBe('/session/abc?message=m%201');
  });
});

describe('documentHref', () => {
  it('links to the document, and to a passage when there is one', () => {
    expect(documentHref('doc')).toBe('/library/doc');
    expect(documentHref('doc', 'chunk 1')).toBe('/library/doc?chunk=chunk%201');
  });
});

describe('recentSessions', () => {
  it('returns the newest first and skips examples', () => {
    const { sessions } = fixture();
    expect(recentSessions(sessions).map((s) => s.id)).toEqual(['s-note', 's-code', 's-recipe']);
    expect(recentSessions(sessions, 2).map((s) => s.id)).toEqual(['s-note', 's-code']);
  });

  it('does not reorder the store', () => {
    const { sessions } = fixture();
    const ids = sessions.map((s) => s.id);
    recentSessions(sessions);
    expect(sessions.map((s) => s.id)).toEqual(ids);
  });
});

describe('dateKeywords', () => {
  it('includes the ISO date, month names and the year', () => {
    const words = dateKeywords(new Date(2026, 2, 9, 8).getTime()).split(' ');
    for (const word of ['2026-03-09', 'march', 'mar', '2026', '9'])
      expect(words).toContain(word);
  });
});

describe('search', () => {
  it('returns nothing for an empty query', async () => {
    expect(await search('')).toEqual([]);
    expect(await search('   ')).toEqual([]);
  });

  it('finds sessions by title', async () => {
    const [hit, ...rest] = await search('parser');
    expect(rest).toEqual([]);
    expect(hit).toMatchObject({ sessionId: 's-code', matchedOn: 'title' });
  });

  it('is case-insensitive', async () => {
    expect(await ids('SOURDOUGH')).toEqual(['s-recipe']);
  });

  it('finds message text and points at the matching turn', async () => {
    const [hit] = await search('levain');
    expect(hit).toMatchObject({ sessionId: 's-recipe', matchedOn: 'message', messageId: 'm2' });
    expect(hit.snippet?.match).toBe('levain');
    expect(hit.snippet?.before.length).toBeGreaterThan(0);
  });

  it('searches text parts of multi-part messages', async () => {
    expect((await search('tokenizer'))[0]).toMatchObject({
      sessionId: 's-code',
      messageId: 'm3',
    });
  });

  it('prefers a turn that contains every word', async () => {
    expect((await search('feed baking'))[0].messageId).toBe('m1');
    expect((await search('feed week'))[0].messageId).toBe('m2');
  });

  it('does not search system prompts', async () => {
    expect(await search('hidden')).toEqual([]);
  });

  it('finds sessions by model title, id or creator', async () => {
    expect(await ids('gpt-5')).toEqual(['s-note', 's-recipe']);
    expect(await search('openai/gpt')).toHaveLength(2);
    expect(await ids('anthropic')).toEqual(['s-code']);
    expect((await search('gpt-5'))[0].matchedOn).toBe('model');
  });

  it('finds sessions by assistant title and its model', async () => {
    expect(await ids('reviewer')).toEqual(['s-code']);
    expect(await ids('claude')).toEqual(['s-code']);
  });

  it('finds sessions by date', async () => {
    expect(await ids('yesterday')).toEqual(['s-code']);
    expect(await ids('today')).toEqual(['s-note']);
    expect(await ids('2026-10-24')).toEqual(['s-recipe']);
    expect((await search('2026-10-24'))[0].matchedOn).toBe('date');
    expect(await ids('october')).toEqual(['s-recipe']);
  });

  it('matches dates by whole keyword only', async () => {
    expect(await search('2026-10')).toEqual([]);
    expect(await search('octo')).toEqual([]);
  });

  it('works out today and yesterday when searching', async () => {
    const later = { now: NOW + DAY };
    expect(await search('today', fixture(), later)).toEqual([]);
    expect((await search('yesterday', fixture(), later)).map((h) => h.sessionId)).toEqual([
      's-note',
    ]);
  });

  it('requires every word to match, in any field', async () => {
    expect(await search('gpt yesterday')).toEqual([]);
    expect(await ids('gpt today')).toEqual(['s-note']);
    expect(await ids('parser claude')).toEqual(['s-code']);
    expect(await search('sourdough zebra')).toEqual([]);
  });

  it('ranks title matches above message matches, then newer first', async () => {
    const state = fixture();
    state.chats.push(chat('c-extra', [message('m7', 'user', 'parser notes')]));
    state.sessions.push(session('s-extra', 'Unrelated', NOW, ['c-extra']));

    expect(await ids('parser', state)).toEqual(['s-code', 's-extra']);
  });

  it('matches the start of a word', async () => {
    expect((await search('lev'))[0]).toMatchObject({ sessionId: 's-recipe', messageId: 'm2' });
    expect(await ids('sour')).toEqual(['s-recipe']);
    expect((await search('lev'))[0].snippet?.match).toBe('levain');
  });

  it('tolerates a typo in longer words', async () => {
    expect(await ids('sourdogh')).toEqual(['s-recipe']);
    expect((await search('tokenzier'))[0]).toMatchObject({
      sessionId: 's-code',
      messageId: 'm3',
    });
    expect((await search('levan'))[0].snippet?.match).toBe('levain');
  });

  it('does not treat short words as typos', async () => {
    expect(await search('fed')).toEqual([]);
  });

  it('ignores punctuation in the query', async () => {
    expect(await ids('levain, / feed!')).toEqual(['s-recipe']);
    expect(await search(' / ')).toEqual([]);
  });

  it('highlights whole words rather than the inside of another word', async () => {
    const state = fixture();
    state.chats[0] = chat('c-recipe', [
      message('m9', 'user', 'Another day, another loaf of the bread'),
    ]);
    const hit = (await search('the', state)).find((h) => h.sessionId === 's-recipe');
    expect(hit?.snippet).toMatchObject({
      before: 'Another day, another loaf of ',
      match: 'the',
    });
  });

  it('searches the text of a note', async () => {
    const state = fixture();
    state.sessions[2] = { ...state.sessions[2], input: 'Draft the quarterly okr summary' };

    const [hit] = await search('okr', state);
    expect(hit).toMatchObject({ sessionId: 's-note', matchedOn: 'message' });
    expect(hit.messageId).toBeUndefined();
    expect(hit.snippet?.match).toBe('okr');
  });

  it('does not search chat drafts', async () => {
    const state = fixture();
    state.sessions[0] = { ...state.sessions[0], input: 'unsent draft' };
    expect(await search('unsent', state)).toEqual([]);
  });

  it('skips example sessions', async () => {
    expect(await search('example')).toEqual([]);
  });

  it('limits the number of results', async () => {
    expect(await search('a', fixture(), { limit: 1 })).toHaveLength(1);
  });

  it('truncates long messages around the match', async () => {
    const state = fixture();
    const long = `${'x '.repeat(200)}needle${' y'.repeat(200)}`;
    state.chats[0] = chat('c-recipe', [message('m9', 'user', long)]);

    const snippet = (await search('needle', state))[0].snippet;
    expect(snippet?.before.startsWith('…')).toBe(true);
    expect(snippet?.after.endsWith('…')).toBe(true);
    expect((snippet?.before.length ?? 0) + (snippet?.after.length ?? 0)).toBeLessThan(150);
  });

  it('handles sessions whose chats are missing from the store', async () => {
    await load(fixture());
    const state = { ...fixture(), chats: [] };
    const { sessions } = await searchDatabase(db, 'parser', state, models, { now: NOW });
    expect(sessions.map((h) => h.sessionId)).toEqual(['s-code']);
  });

  it('finds chats whose messages are not loaded, from the database', async () => {
    const state = fixture();
    await load(state);
    const unloaded = {
      ...state,
      chats: state.chats.map((c) => ({ ...c, messages: [], unloaded: true })),
    };
    const { sessions } = await searchDatabase(db, 'levain', unloaded, models, { now: NOW });
    expect(sessions[0]).toMatchObject({ sessionId: 's-recipe', messageId: 'm2' });
  });

  it('leaves out sessions the store no longer has, before the sync deletes them', async () => {
    const state = fixture();
    await load(state);
    const deleted = { ...state, sessions: state.sessions.filter((s) => s.id !== 's-recipe') };
    const { sessions } = await searchDatabase(db, 'levain', deleted, models, { now: NOW });
    expect(sessions).toEqual([]);
  });

  it('follows a rename', async () => {
    const state = fixture();
    state.sessions[1] = { ...state.sessions[1], title: 'Lexer rewrite' };
    expect((await search('parser', state)).map((h) => h.matchedOn)).toEqual(['message']);
    expect((await search('lexer', state))[0].matchedOn).toBe('title');
  });

  it('picks up edited messages once they are indexed again', async () => {
    const state = fixture();
    await load(state);
    state.chats[1].messages.push(message('m8', 'assistant', 'Use a Pratt parser.'));
    const sync = createDatabaseSync({ getDatabase: async () => db, getState: () => state });
    await sync.prime();
    await sync.sync();
    await indexMessages(db);
    expect(
      (await searchDatabase(db, 'pratt', state, models, { now: NOW })).sessions[0],
    ).toMatchObject({ sessionId: 's-code', messageId: 'm8' });

    state.chats[1].messages[2] = message('m8', 'assistant', 'Use a recursive descent grammar.');
    await sync.sync();
    await indexMessages(db);
    const after = await searchDatabase(db, 'pratt', state, models, { now: NOW });
    expect(after.sessions).toEqual([]);
  });

  it('finds models once they load', async () => {
    expect(await searchAll('anthropic', fixture(), { models: [] })).toEqual({
      sessions: [],
      documents: [],
    });
    expect(await ids('anthropic')).toEqual(['s-code']);
  });

  it('lists a session once when the store lists it twice', async () => {
    const state = fixture();
    state.sessions.push(state.sessions[0]);
    expect(await search('sourdough', state)).toHaveLength(1);
  });
});

describe('searching documents', () => {
  async function withDocuments() {
    const state = fixture();
    await load(state);
    await addDocument(db, {
      id: 'guide',
      title: 'Bread Handbook',
      filename: 'bread.pdf',
      mimeType: 'application/pdf',
      size: 1,
      created: 2,
      text: 'Chapter one.\n\nA levain is a stiff sourdough starter kept for flavour.',
    });
    await addDocument(db, {
      id: 'tax',
      title: 'Tax Return',
      filename: 'tax.pdf',
      mimeType: 'application/pdf',
      size: 1,
      created: 1,
      text: 'Deductions and receipts.',
    });
    return state;
  }

  it('finds documents by text and points at the passage', async () => {
    const state = await withDocuments();
    const { documents, sessions } = await searchDatabase(db, 'levain', state, models, {
      now: NOW,
    });
    expect(sessions.map((h) => h.sessionId)).toEqual(['s-recipe']);
    expect(documents).toHaveLength(1);
    expect(documents[0]).toMatchObject({ documentId: 'guide', matchedOn: 'message' });
    expect(documents[0].chunkId).toBeString();
    expect(documents[0].snippet?.match).toBe('levain');
  });

  it('finds documents by title, and with a typo', async () => {
    const state = await withDocuments();
    const byTitle = await searchDatabase(db, 'handbook', state, models, { now: NOW });
    expect(byTitle.documents).toMatchObject([{ documentId: 'guide', matchedOn: 'title' }]);
    const typo = await searchDatabase(db, 'deductoins', state, models, { now: NOW });
    expect(typo.documents.map((hit) => hit.documentId)).toEqual(['tax']);
  });
});

describe('semantic search', () => {
  const near = (first: number) => [first, ...Array(EMBEDDING_DIMENSIONS - 1).fill(0)];

  /** Gives every chunk an embedding that points the same way unless the text is about bread. */
  async function embedAll() {
    const { rows } = await db.query<{ id: string; text: string }>(
      'select id, text from chunks',
    );
    await saveEmbeddings(
      db,
      'model',
      rows.map((row) => ({
        id: row.id,
        embedding: /bake|levain|starter/.test(row.text) ? near(1) : [0, 1, ...near(0).slice(2)],
      })),
    );
  }

  it('adds results close in meaning, after keyword matches, and points at the passage', async () => {
    const state = fixture();
    await load(state);
    await embedAll();

    const { sessions } = await searchDatabase(db, 'parser', state, models, {
      now: NOW,
      embedding: { vector: near(1), model: 'model' },
    });
    expect(sessions.map((hit) => hit.sessionId)).toEqual(['s-code', 's-recipe']);
    expect(sessions[1].matchedOn).toBe('meaning');
    expect(sessions[1].messageId).toBe('m1');
    expect(sessions[1].snippet).toMatchObject({ match: '' });
    expect(sessions[1].snippet?.after).toStartWith('How long should I feed');
  });

  it('ignores results that are not close, and embeddings from another model', async () => {
    const state = fixture();
    await load(state);
    await embedAll();
    const far = [0, 0, 1, ...Array(EMBEDDING_DIMENSIONS - 3).fill(0)];
    const unrelated = await searchDatabase(db, 'zzz', state, models, {
      now: NOW,
      embedding: { vector: far, model: 'model' },
    });
    expect(unrelated.sessions).toEqual([]);
    const otherModel = await searchDatabase(db, 'zzz', state, models, {
      now: NOW,
      embedding: { vector: near(1), model: 'other' },
    });
    expect(otherModel.sessions).toEqual([]);
  });

  it('ranks a session found both ways above one found only by words', async () => {
    const state = fixture();
    state.chats.push(chat('c-extra', [message('m7', 'user', 'levain bake notes')]));
    state.sessions.push(session('s-extra', 'Starter log', NOW - 20 * DAY, ['c-extra']));
    await load(state);
    await embedAll();

    const { sessions } = await searchDatabase(db, 'notes', state, models, {
      now: NOW,
      embedding: { vector: near(1), model: 'model' },
    });
    expect(sessions[0].sessionId).toBe('s-extra');
    expect(sessions[0].matchedOn).toBe('message');
  });
});
