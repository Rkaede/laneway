import { readdirSync, readFileSync } from 'node:fs';

import { afterEach, describe, expect, it, mock, spyOn } from 'bun:test';

import { cn, download, filenameDate, formatResponseTime, groupByDate } from './util';

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

describe('filenameDate', () => {
  const originalTimeZone = process.env.TZ;

  // `bun test` runs in UTC unless TZ is set, and deleting TZ does not switch it back.
  afterEach(() => {
    process.env.TZ = originalTimeZone ?? 'UTC';
  });

  it.each(['Australia/Melbourne', 'America/Los_Angeles', 'Asia/Kolkata', 'UTC'])(
    'uses the local date and time in %s',
    (timeZone) => {
      process.env.TZ = timeZone;

      expect(filenameDate(new Date(2026, 0, 15, 14, 30, 5))).toBe('2026-01-15_14-30-05');
      // Late and early enough that the UTC date is a different day in the zones above.
      expect(filenameDate(new Date(2026, 0, 15, 23, 59, 59))).toBe('2026-01-15_23-59-59');
      expect(filenameDate(new Date(2026, 0, 15, 0, 0, 0))).toBe('2026-01-15_00-00-00');
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
    expect(cn('rounded-composer', 'rounded-md')).toBe('rounded-md');
    expect(cn('h-input-md', 'h-9')).toBe('h-9');
    expect(cn('px-bubble-x', 'px-2')).toBe('px-2');
    expect(cn('min-h-nav-item-h', 'min-h-8')).toBe('min-h-8');
  });

  it('lets stock shadows override Loom shadow tokens', () => {
    expect(cn('shadow-field', 'shadow-none')).toBe('shadow-none');
    expect(cn('shadow-composer', 'shadow-lg')).toBe('shadow-lg');
  });

  it('reads Loom font size tokens as sizes, not colours', () => {
    expect(cn('text-nav font-nav text-sidebar-item')).toBe(
      'text-nav font-nav text-sidebar-item',
    );
    expect(cn('text-nav-group', 'text-nav-group-fg')).toBe('text-nav-group text-nav-group-fg');
    expect(cn('text-nav', 'text-sm')).toBe('text-sm');
  });

  it('reads Loom font weight tokens as weights, not families', () => {
    expect(cn('font-menu', 'font-mono')).toBe('font-menu font-mono');
    expect(cn('font-nav', 'font-bold')).toBe('font-bold');
  });

  it('lets the last Loom colour token win', () => {
    expect(cn('text-muted', 'text-main')).toBe('text-main');
    expect(cn('bg-surface-raised', 'bg-danger')).toBe('bg-danger');
  });

  it('keeps font size and text colour together', () => {
    expect(cn('text-sm', 'text-muted')).toBe('text-sm text-muted');
  });

  // For each Tailwind theme namespace Loom defines tokens in: a utility that uses the token,
  // and a stock class from the same group. cn() must let the stock class replace the token class.
  const namespaces: Record<
    string,
    (token: string) => [tokenClass: string, stockClass: string]
  > = {
    color: (token) => [`bg-${token}`, 'bg-transparent'],
    ease: (token) => [`ease-${token}`, 'ease-linear'],
    font: (token) => [`font-${token}`, 'font-serif'],
    'font-weight': (token) => [`font-${token}`, 'font-black'],
    leading: (token) => [`leading-${token}`, 'leading-3'],
    radius: (token) => [`rounded-${token}`, 'rounded-none'],
    shadow: (token) => [`shadow-${token}`, 'shadow-none'],
    spacing: (token) => [`p-${token}`, 'p-0'],
    text: (token) => [`text-${token}`, 'text-base'],
    tracking: (token) => [`tracking-${token}`, 'tracking-widest'],
  };
  const longestFirst = Object.keys(namespaces).sort((a, b) => b.length - a.length);

  it('knows every token in the Loom theme files', () => {
    const directory = new URL('./styles/tokens/', import.meta.url);
    const tokens = readdirSync(directory)
      .filter((file) => file.endsWith('.css'))
      .flatMap((file) => {
        const css = readFileSync(new URL(file, directory), 'utf8').replace(
          /\/\*[\s\S]*?\*\//g,
          '',
        );
        const blocks = [...css.matchAll(/@theme[^{]*\{([^}]*)\}/g)].map((match) => match[1]);
        // `--text-nav--line-height` is a modifier of `--text-nav`, not a token of its own.
        return blocks.flatMap((block) =>
          [...block.matchAll(/--([a-z0-9-]+)\s*:/g)]
            .map((match) => match[1])
            .filter((name) => !name.includes('--')),
        );
      });
    const unregistered = tokens.filter((name) => {
      const namespace = longestFirst.find((prefix) => name.startsWith(`${prefix}-`));
      // A namespace this test has no probe for needs one before its tokens can be trusted.
      if (!namespace) return true;
      const [tokenClass, stockClass] = namespaces[namespace](name.slice(namespace.length + 1));
      return cn(tokenClass, stockClass) !== stockClass;
    });

    expect(tokens).toContain('radius-composer');
    expect(tokens).toContain('font-weight-menu');
    expect(unregistered).toEqual([]);
  });
});
