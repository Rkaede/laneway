import { describe, expect, it } from 'bun:test';

import type {
  AssistantProps,
  ChatProps,
  MessageProps,
  ModelProps,
  SessionProps,
} from '~/types';

import {
  dateKeywords,
  messageText,
  recentSessions,
  type SearchState,
  sessionHref,
  SessionIndex,
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

function indexOf(state: SearchState) {
  const index = new SessionIndex();
  index.sync(state, models);
  return index;
}

const search = (query: string, state = fixture()) => indexOf(state).search(query, { now: NOW });

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

describe('searchSessions', () => {
  it('returns nothing for an empty query', () => {
    expect(search('')).toEqual([]);
    expect(search('   ')).toEqual([]);
  });

  it('finds sessions by title', () => {
    const [hit, ...rest] = search('parser');
    expect(rest).toEqual([]);
    expect(hit).toMatchObject({ sessionId: 's-code', matchedOn: 'title' });
  });

  it('is case-insensitive', () => {
    expect(search('SOURDOUGH').map((h) => h.sessionId)).toEqual(['s-recipe']);
  });

  it('finds message text and points at the matching turn', () => {
    const [hit] = search('levain');
    expect(hit).toMatchObject({ sessionId: 's-recipe', matchedOn: 'message', messageId: 'm2' });
    expect(hit.snippet?.match).toBe('levain');
    expect(hit.snippet?.before.length).toBeGreaterThan(0);
  });

  it('searches text parts of multi-part messages', () => {
    expect(search('tokenizer')[0]).toMatchObject({ sessionId: 's-code', messageId: 'm3' });
  });

  it('prefers a turn that contains every word', () => {
    const [hit] = search('feed baking');
    expect(hit.messageId).toBe('m1');
    expect(search('feed week')[0].messageId).toBe('m2');
  });

  it('does not search system prompts', () => {
    expect(search('hidden')).toEqual([]);
  });

  it('finds sessions by model title, id or creator', () => {
    expect(search('gpt-5').map((h) => h.sessionId)).toEqual(['s-note', 's-recipe']);
    expect(search('openai/gpt')).toHaveLength(2);
    expect(search('anthropic').map((h) => h.sessionId)).toEqual(['s-code']);
    expect(search('gpt-5')[0].matchedOn).toBe('model');
  });

  it('finds sessions by assistant title and its model', () => {
    expect(search('reviewer').map((h) => h.sessionId)).toEqual(['s-code']);
    expect(search('claude').map((h) => h.sessionId)).toEqual(['s-code']);
  });

  it('finds sessions by date', () => {
    expect(search('yesterday').map((h) => h.sessionId)).toEqual(['s-code']);
    expect(search('today').map((h) => h.sessionId)).toEqual(['s-note']);
    expect(search('2026-10-24').map((h) => h.sessionId)).toEqual(['s-recipe']);
    expect(search('2026-10-24')[0].matchedOn).toBe('date');
    expect(search('october').map((h) => h.sessionId)).toEqual(['s-recipe']);
  });

  it('matches dates by whole keyword only', () => {
    expect(search('2026-10')).toEqual([]);
    expect(search('octo')).toEqual([]);
  });

  it('works out today and yesterday when searching, not when indexing', () => {
    const index = indexOf(fixture());
    expect(index.search('today', { now: NOW + DAY }).map((h) => h.sessionId)).toEqual([]);
    expect(index.search('yesterday', { now: NOW + DAY }).map((h) => h.sessionId)).toEqual([
      's-note',
    ]);
  });

  it('requires every word to match, in any field', () => {
    expect(search('gpt yesterday')).toEqual([]);
    expect(search('gpt today').map((h) => h.sessionId)).toEqual(['s-note']);
    expect(search('parser claude').map((h) => h.sessionId)).toEqual(['s-code']);
    expect(search('sourdough zebra')).toEqual([]);
  });

  it('ranks title matches above message matches, then newer first', () => {
    const state = fixture();
    state.chats.push(chat('c-extra', [message('m7', 'user', 'parser notes')]));
    state.sessions.push(session('s-extra', 'Unrelated', NOW, ['c-extra']));

    expect(search('parser', state).map((h) => h.sessionId)).toEqual(['s-code', 's-extra']);
  });

  it('matches the start of a word', () => {
    expect(search('lev')[0]).toMatchObject({ sessionId: 's-recipe', messageId: 'm2' });
    expect(search('sour').map((h) => h.sessionId)).toEqual(['s-recipe']);
    expect(search('lev')[0].snippet?.match).toBe('levain');
  });

  it('tolerates a typo in longer words', () => {
    expect(search('sourdogh').map((h) => h.sessionId)).toEqual(['s-recipe']);
    expect(search('tokenzier')[0]).toMatchObject({ sessionId: 's-code', messageId: 'm3' });
    expect(search('levan')[0].snippet?.match).toBe('levain');
  });

  it('does not treat short words as typos', () => {
    expect(search('fed')).toEqual([]);
  });

  it('ignores punctuation in the query', () => {
    expect(search('levain, / feed!').map((h) => h.sessionId)).toEqual(['s-recipe']);
    expect(search(' / ')).toEqual([]);
  });

  it('highlights whole words rather than the inside of another word', () => {
    const state = fixture();
    state.chats[0] = chat('c-recipe', [
      message('m9', 'user', 'Another day, another loaf of the bread'),
    ]);
    expect(search('the', state)[0].snippet).toMatchObject({
      before: 'Another day, another loaf of ',
      match: 'the',
    });
  });

  it('searches the text of a note', () => {
    const state = fixture();
    state.sessions[2] = { ...state.sessions[2], input: 'Draft the quarterly okr summary' };

    const [hit] = search('okr', state);
    expect(hit).toMatchObject({ sessionId: 's-note', matchedOn: 'message' });
    expect(hit.messageId).toBeUndefined();
    expect(hit.snippet?.match).toBe('okr');
  });

  it('does not search chat drafts', () => {
    const state = fixture();
    state.sessions[0] = { ...state.sessions[0], input: 'unsent draft' };
    expect(search('unsent', state)).toEqual([]);
  });

  it('skips example sessions', () => {
    expect(search('example')).toEqual([]);
  });

  it('limits the number of results', () => {
    const results = indexOf(fixture()).search('a', { now: NOW, limit: 1 });
    expect(results).toHaveLength(1);
  });

  it('truncates long messages around the match', () => {
    const state = fixture();
    const long = `${'x '.repeat(200)}needle${' y'.repeat(200)}`;
    state.chats[0] = chat('c-recipe', [message('m9', 'user', long)]);

    const snippet = search('needle', state)[0].snippet;
    expect(snippet?.before.startsWith('…')).toBe(true);
    expect(snippet?.after.endsWith('…')).toBe(true);
    expect((snippet?.before.length ?? 0) + (snippet?.after.length ?? 0)).toBeLessThan(150);
  });

  it('handles sessions whose chats are missing', () => {
    const state = fixture();
    state.chats = [];
    expect(search('parser').map((h) => h.sessionId)).toEqual(['s-code']);
  });
});

describe('syncing with the store', () => {
  const find = (index: SessionIndex, query: string) =>
    index.search(query, { now: NOW }).map((h) => h.sessionId);

  it('drops a session from results once it is deleted', () => {
    const state = fixture();
    const index = indexOf(state);
    expect(find(index, 'levain')).toEqual(['s-recipe']);

    state.sessions = state.sessions.filter((s) => s.id !== 's-recipe');
    state.chats = state.chats.filter((c) => c.id !== 'c-recipe');
    index.sync(state, models);

    expect(find(index, 'levain')).toEqual([]);
  });

  it('finds sessions that appear in the store later, such as a restored backup', () => {
    const index = indexOf({ sessions: [], chats: [], assistants: [] });
    expect(find(index, 'levain')).toEqual([]);

    index.sync(fixture(), models);
    expect(find(index, 'levain')).toEqual(['s-recipe']);
  });

  it('follows a rename', () => {
    const state = fixture();
    const index = indexOf(state);
    state.sessions[1] = { ...state.sessions[1], title: 'Lexer rewrite' };
    index.sync(state, models);

    expect(index.search('parser', { now: NOW }).map((h) => h.matchedOn)).toEqual(['message']);
    expect(index.search('lexer', { now: NOW })[0].matchedOn).toBe('title');
  });

  it('picks up new messages and edits', () => {
    const state = fixture();
    const index = indexOf(state);

    state.chats[1].messages.push(
      message('m8', 'assistant', 'Use a recursive descent grammar.'),
    );
    index.sync(state, models);
    expect(index.search('grammar', { now: NOW })[0]).toMatchObject({ messageId: 'm8' });

    state.chats[1].messages[2] = message('m8', 'assistant', 'Use a Pratt parser.');
    index.sync(state, models);
    expect(find(index, 'grammar')).toEqual([]);
    expect(find(index, 'pratt')).toEqual(['s-code']);
  });

  it('picks up models once they load', () => {
    const state = fixture();
    const index = new SessionIndex();
    index.sync(state, []);
    expect(find(index, 'anthropic')).toEqual([]);

    index.sync(state, models);
    expect(find(index, 'anthropic')).toEqual(['s-code']);
  });

  it('can be synced repeatedly without changes', () => {
    const state = fixture();
    const index = indexOf(state);
    index.sync(state, models);
    index.sync(state, models);
    expect(find(index, 'sourdough')).toEqual(['s-recipe']);
  });

  it('indexes a session once when the store lists it twice', () => {
    const state = fixture();
    state.sessions.push(state.sessions[0]);
    expect(search('sourdough', state)).toHaveLength(1);
  });
});
