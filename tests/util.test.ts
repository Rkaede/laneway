import { formatResponseTime } from '../src/util';
import { describe, expect, it } from 'bun:test';

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
