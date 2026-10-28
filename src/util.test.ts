import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test';

import { cn, download, formatResponseTime, groupByDate } from './util';

describe('download', () => {
  const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');

  afterEach(() => {
    mock.restore();
    if (originalDocument) Object.defineProperty(globalThis, 'document', originalDocument);
    else Reflect.deleteProperty(globalThis, 'document');
  });

  it.each([false, true])(
    'downloads JSON with a Blob URL and revokes it (Blob input: %s)',
    async (blobInput) => {
      const attributes = new Map<string, string>();
      const link = {
        setAttribute: (name: string, value: string) => attributes.set(name, value),
        style: { display: '' },
        click: mock(() => {}),
      };
      const appendChild = mock(() => {});
      const removeChild = mock(() => {});
      Object.defineProperty(globalThis, 'document', {
        configurable: true,
        value: { createElement: () => link, body: { appendChild, removeChild } },
      });
      const createUrl = spyOn(URL, 'createObjectURL').mockReturnValue('blob:backup');
      const revokeUrl = spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      const json = JSON.stringify({ text: 'A backup with Unicode: 🦘' });
      const data = blobInput ? new Blob([json], { type: 'application/json' }) : json;

      download(data, 'laneway-backup.json');

      expect(attributes.get('href')).toBe('blob:backup');
      expect(attributes.get('download')).toBe('laneway-backup.json');
      expect(await (createUrl.mock.calls[0][0] as Blob).text()).toBe(json);
      expect(link.click).toHaveBeenCalledTimes(1);
      expect(appendChild).toHaveBeenCalledWith(link);
      expect(removeChild).toHaveBeenCalledWith(link);
      expect(revokeUrl).not.toHaveBeenCalled();
      await Bun.sleep(10);
      expect(revokeUrl).toHaveBeenCalledWith('blob:backup');
    },
  );
});

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

    const groups = groupByDate([{ ...baseSession, id: 'a', created: sevenDaysAgo.getTime() }]);
    // Debugging
    //console.log({ groups });

    expect(groups.last7Days.map((s) => s.id)).toContain('a');
  });

  it('categorizes sessions older than seven days as older', () => {
    const now = new Date();
    const eightDaysAgo = new Date(now);
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

    const groups = groupByDate([{ ...baseSession, id: 'b', created: eightDaysAgo.getTime() }]);

    expect(groups.older.map((s) => s.id)).toContain('b');
  });
});

describe('cn', () => {
  it('lets stock radius and size classes override Loom token classes', () => {
    expect(cn('rounded-card', 'rounded-md')).toBe('rounded-md');
    expect(cn('h-input-md', 'h-9')).toBe('h-9');
  });

  it('lets the last Loom colour token win', () => {
    expect(cn('text-muted', 'text-main')).toBe('text-main');
    expect(cn('bg-surface-raised', 'bg-danger')).toBe('bg-danger');
  });

  it('keeps font size and text colour together', () => {
    expect(cn('text-sm', 'text-muted')).toBe('text-sm text-muted');
  });
});
