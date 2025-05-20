import { describe, expect, it } from 'bun:test';

import { formatResponseTime, groupByDate } from '../src/util';


// < 2000 returns "Nms"
describe('formatResponseTime', () => {
  it('returns milliseconds for values under 2000', () => {
    expect(formatResponseTime(1500)).toBe('1500ms');
  });

  it('returns seconds with one decimal for values under 60000', () => {
    expect(formatResponseTime(2500)).toBe('2.5s');
  });

  it('returns minutes for values 60000 and above', () => {
    expect(formatResponseTime(120000)).toBe('2.0m');
  });
});

describe('groupByDate', () => {
  const baseSession = {
    id: '1',
    title: 'test',
    type: 'chat' as const,
    chats: [],
  };

  it('categorizes sessions exactly seven days old in last7Days', () => {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const groups = groupByDate([
      { ...baseSession, id: 'a', created: sevenDaysAgo.getTime() },
    ]);
    // Debugging
    //console.log({ groups });

    expect(groups.last7Days.map((s) => s.id)).toContain('a');
  });

  it('categorizes sessions older than seven days as older', () => {
    const now = new Date();
    const eightDaysAgo = new Date(now);
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

    const groups = groupByDate([
      { ...baseSession, id: 'b', created: eightDaysAgo.getTime() },
    ]);

    expect(groups.older.map((s) => s.id)).toContain('b');
  });
});
